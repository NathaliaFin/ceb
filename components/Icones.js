// Icones em SVG inline — evita dependencia externa e carrega instantaneo no celular.
function Svg({ children, tamanho = 18, ...resto }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconeCoracao = (p) => (
  <Svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" /></Svg>
);

export const IconeConversa = (p) => (
  <Svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></Svg>
);

export const IconeNavegacao = (p) => (
  <Svg {...p}><path d="M3 11l19-9-9 19-2-8-8-2z" /></Svg>
);

export const IconePino = (p) => (
  <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></Svg>
);

export const IconePessoas = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const IconePresente = (p) => (
  <Svg {...p}>
    <path d="M20 12v9H4v-9" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </Svg>
);

export const IconeAlerta = (p) => (
  <Svg {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </Svg>
);

export const IconeBusca = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Svg>
);

export const IconeCalendario = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const IconeCheck = (p) => (<Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>);

export const IconeMais = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);

export const IconeLixeira = (p) => (
  <Svg {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Svg>
);

export const IconeSeta = (p) => (<Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>);

export const IconeSair = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
  </Svg>
);

export const IconeLapis = (p) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>
);

export const IconeCasa = (p) => (
  <Svg {...p}><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></Svg>
);

export const IconeNota = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" />
  </Svg>
);

export const IconeCadeado = (p) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

/** Caixa de arquivo: "Familias atendidas". */
export const IconeArquivo = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" /><path d="M10 13h4" />
  </Svg>
);

export const IconeVoltarSeta = (p) => (
  <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Svg>
);
