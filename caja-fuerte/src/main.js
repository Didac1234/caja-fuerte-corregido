
import './style.css'
import { createClient } from '@supabase/supabase-js'

// CONEXION CON SUPABASE

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

// VARIABLES

let usuario = null
let puntos = 0
let aciertos = 0
let tiempo = 60
let intervalo = null
let respuestaCorrecta = 0
let jugando = false

// PANTALLAS

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(function(p) {
        p.classList.add('oculta')
    })

    document.querySelector('#' + id).classList.remove('oculta')
}

function mostrarApp() {
    document.querySelector('#login').classList.add('oculta')
    document.querySelector('#app').classList.remove('oculta')
}

function mostrarLogin() {
    document.querySelector('#login').classList.remove('oculta')
    document.querySelector('#app').classList.add('oculta')
}

// LOGIN CON GOOGLE

document.querySelector('#btn-login').addEventListener('click', async function() {

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    })

    if (error) {
        alert(error.message)
    }
})

// COMPROBAR SESION

async function comprobarSesion() {

    const { data, error } = await supabase.auth.getSession()

    if (error) {
        console.log(error.message)
        mostrarLogin()
        return
    }

    if (data.session) {
        usuario = data.session.user

        document.querySelector('#usuario').textContent =
            usuario.user_metadata.full_name || usuario.email

        mostrarApp()
        mostrarPantalla('inicio')
    } else {
        mostrarLogin()
    }
}

supabase.auth.onAuthStateChange(function(evento, sesion) {

    if (sesion) {
        usuario = sesion.user

        document.querySelector('#usuario').textContent =
            usuario.user_metadata.full_name || usuario.email

        mostrarApp()
        mostrarPantalla('inicio')
    } else {
        usuario = null
        pararJuego()
        mostrarLogin()
    }
})

comprobarSesion()

// CERRAR SESION

document.querySelector('#btn-logout').addEventListener('click', async function() {

    pararJuego()

    const { error } = await supabase.auth.signOut()

    if (error) {
        alert(error.message)
    }
})

// BOTONES DEL MENU

document.querySelector('#btn-empezar').addEventListener('click', empezarJuego)

document.querySelector('#btn-otra').addEventListener('click', empezarJuego)

document.querySelector('#btn-inicio').addEventListener('click', function() {
    pararJuego()
    mostrarPantalla('inicio')
})

document.querySelector('#btn-historial').addEventListener('click', cargarHistorial)

document.querySelector('#btn-volver').addEventListener('click', function() {
    mostrarPantalla('inicio')
})

// EMPEZAR JUEGO

function empezarJuego() {

    pararJuego()

    puntos = 0
    aciertos = 0
    tiempo = 60
    jugando = true

    actualizarInfo()

    mostrarPantalla('juego')

    generarOperacion()

    intervalo = setInterval(function() {

        tiempo--

        actualizarInfo()

        if (tiempo <= 0) {
            terminarJuego()
        }

    }, 1000)
}

// GENERAR OPERACION

function generarOperacion() {

    let num1 = Math.floor(Math.random() * 20) + 1
    let num2 = Math.floor(Math.random() * 20) + 1

    let tipo = Math.floor(Math.random() * 3)

    let operacion = ''

    if (tipo === 0) {
        operacion = '+'
        respuestaCorrecta = num1 + num2
    }

    if (tipo === 1) {
        operacion = '-'

        if (num1 < num2) {
            let temporal = num1
            num1 = num2
            num2 = temporal
        }

        respuestaCorrecta = num1 - num2
    }

    if (tipo === 2) {
        operacion = '*'
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1

        respuestaCorrecta = num1 * num2
    }

    document.querySelector('#operacion').textContent =
        num1 + ' ' + operacion + ' ' + num2

    generarRespuestas()
}

// GENERAR RESPUESTAS

function generarRespuestas() {

    let respuestas = [respuestaCorrecta]

    while (respuestas.length < 4) {

        let numero = respuestaCorrecta + Math.floor(Math.random() * 21) - 10

        if (numero >= 0 && !respuestas.includes(numero)) {
            respuestas.push(numero)
        }
    }

    respuestas.sort(function() {
        return Math.random() - 0.5
    })

    let botones = document.querySelectorAll('.respuesta')

    for (let i = 0; i < botones.length; i++) {

        botones[i].textContent = respuestas[i]

        botones[i].onclick = function() {
            comprobarRespuesta(respuestas[i])
        }
    }
}

// COMPROBAR RESPUESTA

function comprobarRespuesta(respuesta) {

    if (!jugando) {
        return
    }

    if (respuesta === respuestaCorrecta) {

        puntos = puntos + 10
        aciertos++

        document.querySelector('#mensaje').textContent = '¡Correcto! +10 puntos'
        document.querySelector('#mensaje').style.color = '#10b981'

    } else {

        document.querySelector('#mensaje').textContent = '¡Incorrecto!'
        document.querySelector('#mensaje').style.color = '#ef4444'
    }

    actualizarInfo()

    generarOperacion()
}

// ACTUALIZAR INFORMACION

function actualizarInfo() {

    document.querySelector('#tiempo').textContent = tiempo
    document.querySelector('#puntos').textContent = puntos
    document.querySelector('#aciertos').textContent = aciertos
}

// TERMINAR JUEGO

async function terminarJuego() {

    pararJuego()

    document.querySelector('#titulo-resultado').textContent =
        '¡Se acabó el tiempo!'

    document.querySelector('#resultado-puntos').textContent = puntos

    document.querySelector('#resultado-aciertos').textContent = aciertos

    document.querySelector('#guardado').textContent = 'Guardando partida...'

    mostrarPantalla('resultado')

    // GUARDAR PARTIDA EN SUPABASE

    const { error } = await supabase.from('speedmath_partidas').insert({

        user_id: usuario.id,
        puntos: puntos,
        aciertos: aciertos

    })

    if (error) {

        document.querySelector('#guardado').textContent =
            'Error al guardar: ' + error.message

    } else {

        document.querySelector('#guardado').textContent =
            'Partida guardada correctamente ✅'
    }
}

// PARAR JUEGO

function pararJuego() {

    clearInterval(intervalo)

    intervalo = null
    jugando = false
}

// HISTORIAL

async function cargarHistorial() {

    mostrarPantalla('historial')

    const lista = document.querySelector('#lista')

    lista.innerHTML = ''

    const { data, error } = await supabase
        .from('speedmath_partidas')
        .select('*')
        .order('fecha', { ascending: false })

    if (error) {

        lista.textContent = error.message
        return
    }

    document.querySelector('#total').textContent = data.length

    data.forEach(function(partida) {

        let fila = document.createElement('tr')

        let fecha = document.createElement('td')
        fecha.textContent = new Date(partida.fecha).toLocaleString('es-ES')

        let puntosPartida = document.createElement('td')
        puntosPartida.textContent = partida.puntos

        let aciertosPartida = document.createElement('td')
        aciertosPartida.textContent = partida.aciertos

        fila.appendChild(fecha)
        fila.appendChild(puntosPartida)
        fila.appendChild(aciertosPartida)

        lista.appendChild(fila)
    })
}
