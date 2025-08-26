# Breakpoint Debugging Worker logic

It is possible to debug the worker logic using breakpoints and even sourcemaps by:
1. Perform a build with `yarn build`
2. Start the main app (any type of console works) with `yarn start`
3. Now to debug and start the worker, open VS Code JavaScript Debug Console (auto-attaching debugger) and run

```bash
DATABASE_URL=postgresql://postgres:pass@localhost:5432/ocx-loader yarn worker
```

If reading this at a later time - it could be possible that the tooling has improved and you might not need to start the worker separately like this but it could be that it works with just `yarn dev` which watches for changes on the code.