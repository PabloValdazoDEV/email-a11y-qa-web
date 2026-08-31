import { useState } from "react";
import { Input } from "./Input.jsx";

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative min-w-0">
      <Input {...props} type={visible ? "text" : "password"} className="[&_input]:pr-24" />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="focus-ring absolute right-2 top-[2.15rem] rounded-md px-2 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
