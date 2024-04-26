Use dotenvx: ```brew install dotenvx/brew/dotenvx```

Set your test db url in .env.test.local

Create your test db with ```dotenvx run -f .env.test.local -- blitz prisma migrate dev```

Run tests using ```dotenvx run -f .env.test.local -- yarn test src/app/...```
