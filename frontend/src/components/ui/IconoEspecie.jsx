import { Dog, Cat, Bird, Turtle, PawPrint } from 'lucide-react';

// Ícono de línea por especie; reemplaza los emojis para mantener un estilo visual uniforme
export const ICONOS_ESPECIE = { perro: Dog, gato: Cat, ave: Bird, reptil: Turtle };

export default function IconoEspecie({ especie, ...props }) {
  const Icono = ICONOS_ESPECIE[especie] ?? PawPrint;
  return <Icono aria-hidden="true" {...props} />;
}
