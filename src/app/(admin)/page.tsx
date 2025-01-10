import Link from "next/link"
import { invoke } from "../blitz-server"
import { LogoutButton } from "../(auth)/components/LogoutButton"
import styles from "../styles/Home.module.css"
import getCurrentUser from "../(admin)/users/queries/getCurrentUser"

export default async function Home() {
  const currentUser = await invoke(getCurrentUser, null)
  return (
    <>
      <div className={styles.homeMainDiv}>
        {currentUser ? (
          <>
            <div>
              <a href={"/admin"} className={styles.button}>
                <strong>Admin Panel</strong>
              </a>
            </div>

            <div>
              <a href={"/bundles"} className={styles.button}>
                <strong>Bundles</strong>
              </a>
            </div>

            <LogoutButton />

            <div>
              User id: <code>{currentUser.id}</code>
              <br />
              User role: <code>{currentUser.role}</code>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.loginButton}>
              <strong>Login</strong>
            </Link>
          </>
        )}
      </div>
    </>
  )
}
