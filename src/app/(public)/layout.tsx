import '@picocss/pico/css/pico.min.css';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='container'>{children}</div>
}
