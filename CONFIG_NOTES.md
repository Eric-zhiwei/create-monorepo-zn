# Config Notes

## `tsconfig.json`

这个文件控制 TypeScript 如何理解和检查项目里的 `.ts` 文件。

- `compilerOptions`: TypeScript 编译器的主要行为配置。
- `target: "ES2020"`: 指定输出的 JavaScript 语法级别为 ES2020。
- `module: "CommonJS"`: 指定模块输出格式为 CommonJS，适合当前 Node CLI 项目。
- `moduleResolution: "Node"`: 依照 Node 的规则解析 `import` 和依赖包。
- `lib: ["ES2020"]`: 告诉 TypeScript 可以使用哪些内置标准库类型。
- `rootDir: "src"`: 约定源码目录是 `src`。
- `outDir: "dist"`: 约定构建产物输出到 `dist`。
- `esModuleInterop: true`: 让 CommonJS 包和 ESModule 的导入方式更兼容。
- `forceConsistentCasingInFileNames: true`: 避免因为文件名大小写不一致导致跨平台问题。
- `strict: true`: 开启严格类型检查。
- `skipLibCheck: true`: 跳过第三方类型声明的检查，通常能提升编译速度。
- `resolveJsonModule: true`: 允许 `import xxx from './a.json'` 这样的写法。
- `types: ["node"]`: 注入 Node.js 的全局类型。
- `include`: 指定要参与类型检查的文件。
- `exclude`: 指定不参与检查的目录。

## `package.json`

`package.json` 是 npm/pnpm 包的元信息和脚本入口配置。它本身是标准 JSON，不能直接加注释，否则包管理器会报错，所以说明放在这里。

- `name`: 包名，发布到 npm 时使用。
- `version`: 当前包版本号。
- `description`: 包的简介说明。
- `keywords`: 方便在 npm 检索时被搜索到的关键词。
- `repository`: 仓库地址信息。
- `license`: 开源协议。
- `author`: 作者信息。
- `type: "commonjs"`: 指定当前包默认按 CommonJS 处理。
- `packageManager: "pnpm@10"`: 约定项目使用的包管理器及大版本。
- `main: "dist/index.js"`: 包被其他项目 `require` 时的默认入口。
- `types: "dist/index.d.ts"`: TypeScript 使用者拿到的类型声明入口。
- `exports`: 更明确地声明包对外暴露的入口。
- `bin`: 声明 CLI 命令和实际执行文件的映射关系。
- `files`: 发布到 npm 时要包含的文件或目录。
- `scripts`: 常用命令集合。
- `scripts.clean`: 清理构建产物目录。
- `scripts.typecheck`: 只做类型检查，不生成文件。
- `scripts.build`: 先清理，再类型检查，最后执行打包。
- `scripts.dev`: 监听模式下持续构建。
- `scripts.prepublishOnly`: 发布前自动执行构建。
- `scripts.release`: 生成 changelog、打 tag 并发布 npm。
- `scripts.postrelease`: 发布后把 tag 和提交推送到远程仓库。
- `dependencies`: 运行时依赖，用户安装你的包时也会安装。
- `devDependencies`: 开发和构建时依赖，通常不会随包一起作为运行依赖安装。
