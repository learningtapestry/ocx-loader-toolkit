import Link from "next/link"
import { invoke } from "./blitz-server"
import { LogoutButton } from "./(auth)/components/LogoutButton"
import styles from "./styles/Home.module.css"
import getCurrentUser from "./users/queries/getCurrentUser"

export default async function Home() {
  const currentUser = await invoke(getCurrentUser, null)
  return (
    <>
      <div className={styles.homeMainDiv}>
        {currentUser ? (
          <>
            <div>
              <a href={"/bundles"} className={styles.button}>
                <strong>Bundles</strong>
              </a>
            </div>

            <div>
              <a href={"/export-destinations"} className={styles.button}>
                <strong>Export Destinations</strong>
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
            <Link href="/signup" className={styles.button}>
              <strong>Sign Up</strong>
            </Link>
            <Link href="/login" className={styles.loginButton}>
              <strong>Login</strong>
            </Link>
          </>
        )}
      </div>
    </>
  )
}
