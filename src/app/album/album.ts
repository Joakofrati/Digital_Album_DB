import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Carta {
  id: number;
  nombre: string;
  archivo: string;
  expansion: string;
  cantidad: number; 
  cantidadPrevia?: number; // ¡NUEVO: La memoria de la carta!
}

type TipoFiltro = 'todas' | 'tengo' | 'faltan';

@Component({
  selector: 'app-album',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './album.html',
  styleUrls: ['./album.css']
})
export class AlbumComponent implements OnInit {
  cartas: Carta[] = [];
  filtroActual: TipoFiltro = 'todas';

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    const catalogoBase: Carta[] = Array.from({ length: 129 }, (_, i) => ({
      id: i + 1,
      nombre: `Carta ${i + 1}`,
      archivo: `Carta_${i + 1}.jpg`,
      expansion: 'expansion_1',
      cantidad: 0
    }));

    if (typeof window !== 'undefined' && window.localStorage) {
      const guardado = localStorage.getItem('albumCromerosDBZ');
      if (guardado) {
        const progreso = JSON.parse(guardado);
        this.cartas = catalogoBase.map(carta => {
          let cant = 0;
          // Lógica de migración: Si antes era "true", ahora es 1.
          if (typeof progreso[carta.id] === 'boolean') {
            cant = progreso[carta.id] ? 1 : 0;
          } else if (typeof progreso[carta.id] === 'number') {
            cant = progreso[carta.id];
          }
          return { ...carta, cantidad: cant };
        });
        return;
      }
    } 
    this.cartas = catalogoBase;
  }

  private guardarProgreso(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const progreso: Record<number, number> = {};
      this.cartas.forEach(c => {
        // Solo guardamos las que tienen al menos 1 para que el JSON sea liviano
        if (c.cantidad > 0) progreso[c.id] = c.cantidad; 
      });
      localStorage.setItem('albumCromerosDBZ', JSON.stringify(progreso));
    }
  }

  // Actualizamos los filtros
  get cartasFiltradas(): Carta[] {
    if (this.filtroActual === 'tengo') return this.cartas.filter(c => c.cantidad > 0);
    if (this.filtroActual === 'faltan') return this.cartas.filter(c => c.cantidad === 0);
    return this.cartas;
  }

  // Si hace click en la carta entera, actúa como un interruptor rápido (0 o 1)
  toggleCarta(carta: Carta): void {
    if (carta.cantidad > 0) {
      // Se desmarca: Guardamos la cantidad actual en la memoria antes de ponerla en 0
      carta.cantidadPrevia = carta.cantidad;
      carta.cantidad = 0;
    } else {
      // Se marca: Si tiene una memoria guardada mayor a 0, la recuperamos. Si no, le ponemos 1.
      carta.cantidad = (carta.cantidadPrevia && carta.cantidadPrevia > 0) ? carta.cantidadPrevia : 1;
    }
    this.guardarProgreso();
  }
  // Nuevas funciones para los botones del contador
  sumarCopia(carta: Carta, event: Event): void {
    event.stopPropagation(); // Evita que se dispare el click de toda la carta
    carta.cantidad++;
    this.guardarProgreso();
  }

  restarCopia(carta: Carta, event: Event): void {
    event.stopPropagation();
    if (carta.cantidad > 0) {
      carta.cantidad--;
      this.guardarProgreso();
    }
  }

  // Estadísticas
  get totalObtenidas(): number {
    return this.cartas.filter(c => c.cantidad > 0).length; // Únicas obtenidas
  }
  
  get totalRepetidas(): number {
    // Suma todo lo que exceda 1 copia
    return this.cartas.reduce((acc, c) => acc + (c.cantidad > 1 ? c.cantidad - 1 : 0), 0);
  }

  // Descarga un archivo .json físico con tu progreso
  exportarProgreso(): void {
    const guardado = localStorage.getItem('albumCromerosDBZ');
    if (!guardado) {
      alert('No hay progreso para exportar.');
      return;
    }

    const blob = new Blob([guardado], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi_progreso_dbz.json';
    a.click();
    
    window.URL.revokeObjectURL(url);
  }

  // Lee un archivo .json físico y actualiza el álbum
  importarProgreso(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const contenido = e.target?.result as string;
        // Validamos que sea un JSON válido
        JSON.parse(contenido); 
        
        // Lo guardamos en el navegador y recargamos
        localStorage.setItem('albumCromerosDBZ', contenido);
        this.cargarCatalogo(); // Volvemos a pintar las cartas
        alert('¡Progreso cargado con éxito!');
      } catch (error) {
        alert('Error: El archivo no es un JSON válido.');
      }
    };

    reader.readAsText(file);
    // Limpiamos el input por si querés volver a cargar el mismo archivo
    input.value = ''; 
  }

  // Le decimos que reciba un string genérico desde el HTML...
  setFiltro(filtro: string): void {
    // ...y acá lo forzamos a convertirse en nuestro TipoFiltro
    this.filtroActual = filtro as TipoFiltro;
  }

  cambiarCantidad(carta: Carta, event: Event): void {
    const input = event.target as HTMLInputElement;
    let nuevaCantidad = parseInt(input.value, 10);

    // Validamos que no metan letras o números negativos
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
      nuevaCantidad = 0;
    }

    carta.cantidad = nuevaCantidad;
    
    // Si la cantidad es mayor a 0, también actualizamos su memoria
    if (nuevaCantidad > 0) {
      carta.cantidadPrevia = nuevaCantidad;
    }

    this.guardarProgreso();
  }

}