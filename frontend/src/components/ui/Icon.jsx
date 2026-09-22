const ICONS = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  file: (
    <>
      <path d="M14 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z" />
      <path d="M14 3.5V8.5h5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  users: (
    <>
      <path d="M16 20.5v-1.8a3.7 3.7 0 0 0-3.7-3.7H7.2A3.7 3.7 0 0 0 3.5 18.7v1.8" />
      <circle cx="9.8" cy="7.2" r="2.7" />
      <path d="M20.5 20.5v-1.8a3.7 3.7 0 0 0-2.8-3.6" />
      <path d="M15.2 4.6a2.7 2.7 0 0 1 0 5.2" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21V14" />
      <path d="M4 10V3" />
      <path d="M12 21V12" />
      <path d="M12 8V3" />
      <path d="M20 21V16" />
      <path d="M20 12V3" />
      <path d="M1.5 14h5" />
      <path d="M9.5 8h5" />
      <path d="M17.5 16h5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 20.5H5.5A2 2 0 0 1 3.5 18.5v-13A2 2 0 0 1 5.5 3.5H9" />
      <path d="M16 16.5 20.5 12 16 7.5" />
      <path d="M20.5 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  pencil: (
    <>
      <path d="M12.5 20.5h8" />
      <path d="M16.2 3.8a2.2 2.2 0 0 1 3.1 3.1L8.2 18.1 4 19.2l1.1-4.2z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6.5 3.5h11V20l-1.8-1.3-1.8 1.3-1.9-1.3L10 20l-1.8-1.3L6.5 20z" />
      <path d="M9 8.5h6" />
      <path d="M9 12.5h6" />
    </>
  ),
};

export default function Icon({ name, size = 18 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
