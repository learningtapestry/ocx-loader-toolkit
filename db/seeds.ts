import db from "./index"
import {SecurePassword} from "@blitzjs/auth/secure-password"

const seed = async () => {
  const password = "admin123!"
  const improvedHash = await SecurePassword.hash(password)

  const project = await db.user.create({
    data: {
      name: "FooBar",
      email: "admin@admin.com",
      hashedPassword: improvedHash
    }
  })
}

export default seed
