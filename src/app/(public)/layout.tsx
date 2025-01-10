import '@picocss/pico/css/pico.min.css';
import '../styles/public/layout.css';
import { ClientInfoVar } from '../components/ClientInfoVar';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className='publicHeader'>
        <h1><ClientInfoVar field="clientName"/> Canvas Loader</h1>
      </div>

      <div className='container' style={{ marginTop: '1em' }}>
        {children}
      </div>
    </>
  )
}
