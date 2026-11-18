import './style.css'
import { createClient } from '@supabase/supabase-js'

// Conexión con Supabase (las claves están en el archivo .env)
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

const EMOJIS = ['🐶', '🐱', '🐸', '🐵', '🦊', '🐼', '🐯', '🐙']
const TIEMPO_TOTAL = 60

let usuario = null
let cartas = []
let primera = null
let bloqueado = false
let jugando = false
let aciertos = 0
let fallos = 0
let tiempo = TIEMPO_TOTAL
let intervalo = null
let temporizadorFallo = null

// ---------- PANTALLAS ----------

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(function (p) {
        p.classList.add('oculta')
    })
    document.querySelector('#' + id).classList.remove('oculta')
}

function mostrarLogin() {
    document.querySelector('#login').classList.remove('oculta')
    document.querySelector('#app').classList.add('oculta')
}

function mostrarApp() {
    document.querySelector('#login').classList.add('oculta')
    document.querySelector('#app').classList.remove('oculta')
}

// ---------- LOGIN ----------

document.querySelector('#btn-login').addEventListener('click', async function () {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    })
})

document.querySelector('#btn-logout').addEventListener('click', async function () {
    pararJuego()
    await supabase.auth.signOut()
})

// Se ejecuta al cargar la página (si hay sesión guardada) y al iniciar/cerrar sesión
supabase.auth.onAuthStateChange(function (evento, sesion) {
    if (sesion && !usuario) {
        usuario = sesion.user
        document.querySelector('#usuario').textContent =
            usuario.user_metadata.full_name || usuario.email
        mostrarApp()
        mostrarPantalla('inicio')
    }
    if (!sesion) {
        usuario = null
        mostrarLogin()
    }
})

// ---------- MENÚ ----------

document.querySelector('#btn-jugar').addEventListener('click', function () {
    pararJuego()
    mostrarPantalla('inicio')
})

document.querySelector('#btn-historial').addEventListener('click', function () {
    pararJuego()
    cargarHistorial()
})

document.querySelector('#btn-ver-historial').addEventListener('click', cargarHistorial)
document.querySelector('#btn-empezar').addEventListener('click', empezarPartida)
document.querySelector('#btn-otra').addEventListener('click', empezarPartida)

// ---------- JUEGO ----------

function pararJuego() {
    clearInterval(intervalo)
    clearTimeout(temporizadorFallo)
    bloqueado = false
    jugando = false
}

function empezarPartida() {
    pararJuego()
    aciertos = 0
    fallos = 0
    tiempo = TIEMPO_TOTAL
    primera = null
    bloqueado = false
    jugando = true

    // Dos de cada emoji, mezclados
    cartas = EMOJIS.concat(EMOJIS)
    cartas.sort(function () {
        return Math.random() - 0.5
    })

    pintarTablero()
    actualizarInfo()
    mostrarPantalla('juego')

    intervalo = setInterval(function () {
        tiempo--
        actualizarInfo()
        if (tiempo <= 0) {
            terminarPartida('Perdida')
        }
    }, 1000)
}

function pintarTablero() {
    const tablero = document.querySelector('#tablero')
    tablero.innerHTML = ''

    cartas.forEach(function (emoji, i) {
        const boton = document.createElement('button')
        boton.className = 'carta'
        boton.textContent = '?'
        boton.addEventListener('click', function () {
            girarCarta(boton, i)
        })
        tablero.appendChild(boton)
    })
}

function actualizarInfo() {
    document.querySelector('#tiempo').textContent = tiempo
    document.querySelector('#aciertos').textContent = aciertos
    document.querySelector('#fallos').textContent = fallos
}

function girarCarta(boton, i) {
    if (!jugando || bloqueado) return
    if (boton.classList.contains('girada')) return

    boton.classList.add('girada')
    boton.textContent = cartas[i]

    // Primera carta de la pareja
    if (primera === null) {
        primera = { boton: boton, i: i }
        return
    }

    // Segunda carta
    const anterior = primera
    primera = null

    if (cartas[anterior.i] === cartas[i]) {
        // Pareja acertada
        aciertos++
        anterior.boton.classList.add('acertada')
        boton.classList.add('acertada')
        actualizarInfo()
        if (aciertos === EMOJIS.length) {
            terminarPartida('Ganada')
        }
    } else {
        // Fallo: se vuelven a tapar después de un momento
        fallos++
        bloqueado = true
        actualizarInfo()
        temporizadorFallo = setTimeout(function () {
            anterior.boton.classList.remove('girada')
            anterior.boton.textContent = '?'
            boton.classList.remove('girada')
            boton.textContent = '?'
            bloqueado = false
        }, 800)
    }
}

async function terminarPartida(resultado) {
    pararJuego()

    const duracion = TIEMPO_TOTAL - tiempo
    let puntuacion = aciertos * 100 - fallos * 10
    if (resultado === 'Ganada') {
        puntuacion = puntuacion + tiempo * 5
    }
    if (puntuacion < 0) {
        puntuacion = 0
    }

    document.querySelector('#resultado-titulo').textContent =
        resultado === 'Ganada' ? '🎉 ¡Has ganado!' : '⏰ Se acabó el tiempo'
    document.querySelector('#resultado-puntos').textContent = puntuacion
    document.querySelector('#resultado-duracion').textContent = duracion
    document.querySelector('#resultado-guardado').textContent = 'Guardando partida...'
    mostrarPantalla('resultado')

    // Guardar la partida en PostgreSQL
    const { error } = await supabase.from('partidas').insert({
        user_id: usuario.id,
        resultado: resultado,
        puntuacion: puntuacion,
        duracion: duracion
    })

    if (error) {
        document.querySelector('#resultado-guardado').textContent =
            'Error al guardar la partida: ' + error.message
    } else {
        document.querySelector('#resultado-guardado').textContent = 'Partida guardada ✅'
    }
}

// ---------- HISTORIAL ----------

async function cargarHistorial() {
    mostrarPantalla('historial')
    const lista = document.querySelector('#lista')
    lista.innerHTML = ''

    // Gracias a RLS solo llegan las partidas del usuario
    const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .order('fecha', { ascending: false })

    if (error) {
        lista.innerHTML = '<tr><td colspan="4">Error: ' + error.message + '</td></tr>'
        return
    }

    document.querySelector('#total').textContent = data.length

    data.forEach(function (partida) {
        const fecha = new Date(partida.fecha).toLocaleString('es-ES')
        lista.innerHTML +=
            '<tr>' +
            '<td>' + fecha + '</td>' +
            '<td>' + partida.resultado + '</td>' +
            '<td>' + partida.puntuacion + '</td>' +
            '<td>' + partida.duracion + ' s</td>' +
            '</tr>'
    })
}
