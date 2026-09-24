// Importar Firebase desde los CDN oficiales (versión modular para la web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tus credenciales oficiales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDzOrsyulIroMNgo-tpMFtv8p8nelLiLrs",
  authDomain: "wampu-productos.firebaseapp.com",
  projectId: "wampu-productos",
  storageBucket: "wampu-productos.firebasestorage.app",
  messagingSenderId: "1084885545588",
  appId: "1:1084885545588:web:a7f884388a902b689cd721",
  measurementId: "G-GK3S4QBBD9"
};

// Inicializar Firebase Firestore una sola vez
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Detectar la habitación desde la URL (ejemplo: ?hab=101)
const urlParams = new URLSearchParams(window.location.search);
const habitacionId = urlParams.get('hab') || 'general';

document.addEventListener('DOMContentLoaded', async () => {
    const productos = document.querySelectorAll('.producto');
    const totalPrecioEl = document.getElementById('total-precio');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const numeroWhatsApp = "593962684773";

    // Referencia al documento de esta habitación específica en la base de datos
    const docRef = doc(db, "consumos", habitacionId);

    // Cargar consumos previos desde la nube al abrir la página
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const datosGuardados = docSnap.data();
            productos.forEach(prod => {
                const id = prod.getAttribute('data-id');
                if (datosGuardados[id] !== undefined) {
                    prod.querySelector('.cantidad').textContent = datosGuardados[id];
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar los datos de Firebase:", error);
    }

    // Actualizar totales iniciales visuales
    actualizarTotal();

    function actualizarTotal() {
        let totalGeneral = 0;
        let mensajePedido = `Hola, quisiera realizar el pedido del minibar (Habitación ${habitacionId}):%0A`;
        let hayProductos = false;
        let estadoConsumo = {};

        productos.forEach(prod => {
            const id = prod.getAttribute('data-id');
            const nombre = prod.getAttribute('data-nombre');
            const precio = parseFloat(prod.getAttribute('data-precio'));
            const cantidadEl = prod.querySelector('.cantidad');
            const cantidad = parseInt(cantidadEl.textContent);

            estadoConsumo[id] = cantidad;

            if (cantidad > 0) {
                hayProductos = true;
                const subtotal = precio * cantidad;
                totalGeneral += subtotal;
                mensajePedido += `- ${cantidad}x ${nombre} ($${subtotal.toFixed(2)})%0A`;
            }
        });

        if (hayProductos) {
            mensajePedido += `%0A*Total a pagar: $${totalGeneral.toFixed(2)}*`;
            whatsappBtn.style.pointerEvents = "auto";
            whatsappBtn.style.opacity = "1";
        } else {
            mensajePedido = `Hola, quisiera consultar el minibar de la habitación ${habitacionId}.`;
            whatsappBtn.style.pointerEvents = "none";
            whatsappBtn.style.opacity = "0.5";
        }

        totalPrecioEl.textContent = `$${totalGeneral.toFixed(2)}`;
        whatsappBtn.href = `https://wa.me/${numeroWhatsApp}?text=${mensajePedido}`;

        // Guardar automáticamente en la nube cada vez que cambien las cantidades
        setDoc(docRef, estadoConsumo, { merge: true }).catch(error => {
            console.error("Error al guardar en Firebase:", error);
        });
    }

    productos.forEach(prod => {
        const btnSumar = prod.querySelector('.sumar');
        const btnRestar = prod.querySelector('.restar');
        const cantidadEl = prod.querySelector('.cantidad');

        btnSumar.addEventListener('click', () => {
            let cantidad = parseInt(cantidadEl.textContent);
            cantidadEl.textContent = cantidad + 1;
            actualizarTotal();
        });

        btnRestar.addEventListener('click', () => {
            let cantidad = parseInt(cantidadEl.textContent);
            if (cantidad > 0) {
                cantidadEl.textContent = cantidad - 1;
                actualizarTotal();
            }
        });
    });
});