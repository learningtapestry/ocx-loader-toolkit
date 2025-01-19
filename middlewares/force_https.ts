import  { NextFetchEvent, NextRequest, NextResponse } from 'next/server'


type Environment = "production" | "development" | "other";
export function forceHttps(req: NextRequest, ev: NextFetchEvent) {
    const currentEnv = process.env.NODE_ENV as Environment;

    if (currentEnv === 'development' && 
        req.headers.get("x-forwarded-proto") !== "https") {
        return NextResponse.redirect(
            `https://${req.headers.get('host')}${req.nextUrl.pathname}`,
            301
        );
    } 
    return NextResponse.next();
}

// https://stackoverflow.com/questions/71052591/writing-blitz-js-middleware-to-return-plain-text-for-a-url-endpoint

// import { BlitzApiRequest, BlitzApiResponse } from "blitz"
// import Cors from "cors"

// // Initializing the cors middleware
// const cors = Cors({
//   methods: ["GET", "POST", "HEAD", "OPTIONS"],
// })

// // Helper method to wait for a middleware to execute before continuing
// // And to throw an error when an error happens in a middleware
// function runMiddleware(req, res, fn) {
//     return new Promise((resolve, reject) => {
//       fn(req, res, (result) => {
//         if (result instanceof Error) {
//           return reject(result)
//         }
  
//         return resolve(result)
//       })
//     })
//   }
  
//   async function handler(req: BlitzApiRequest, res: BlitzApiResponse) {
//     // Run the middleware
//     return await runMiddleware(req, res, cors)
//   }
  
//   export default handler

