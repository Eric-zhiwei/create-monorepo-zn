#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

// 模板目录路径
const TEMPLATE_DIR = path.join(__dirname, 'templates');

async function createMonorepo() {
  try {
    console.log('🚀 创建 Monorepo 项目脚手架\n');
    
    // 1. 询问用户文件夹名
    const { folderName } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'folderName',
        message: '请输入项目文件夹名称：',
        default: 'my-monorepo-project',
        validate: (input) => {
          if (!input || !input.trim()) {
            return '文件夹名称不能为空';
          }
          const trimmedInput = input.trim();
          if (/[A-Z]/.test(trimmedInput)) {
            return '文件夹名称不能包含大写字母，请使用小写字母和连字符';
          }
          if (!/^[a-z0-9-]+$/.test(trimmedInput)) {
            return '只能包含小写字母、数字和连字符(-)';
          }
          if (fs.existsSync(path.join(process.cwd(), trimmedInput))) {
            return '文件夹已存在，请使用其他名称';
          }
          return true;
        },
        filter: (input) => {
          return input ? input.toLowerCase().trim() : '';
        }
      }
    ]);

    if (!folderName) {
      console.log('❌ 文件夹名称不能为空');
      process.exit(1);
    }

    const targetDir = path.join(process.cwd(), folderName);

    console.log(`\n📁 正在创建项目: ${folderName}`);
    
    // 2. 生成 package.json 名称（全部小写，允许连字符）
    const packageName = folderName.toLowerCase().trim();
    
    // 3. 创建目标文件夹
    await fs.ensureDir(targetDir);
    
    // 4. 复制模板文件
    console.log('📄 复制模板文件...');
    await fs.copy(TEMPLATE_DIR, targetDir);
    
    // 5. 修改根目录 package.json
    const rootPackageJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(rootPackageJsonPath)) {
      console.log('🔧 更新根目录 package.json...');
      const rootPackageJson = await fs.readJson(rootPackageJsonPath);
      rootPackageJson.name = packageName;
      await fs.writeJson(rootPackageJsonPath, rootPackageJson, { spaces: 2 });
    }
    
    // 6. 递归查找并修改所有子包的 package.json
    console.log('🔧 更新子包作用域...');
    await updateSubpackages(targetDir, packageName);
    
    console.log('\n✅ 项目创建成功！');
    console.log(`📦 项目名称: ${packageName}`);
    console.log(`🏷️  作用域: @${packageName}`);
    
    console.log('\n📁 目录结构:');
    console.log(`  📂 ${folderName}/`);
    console.log('  ├── package.json');
    console.log('  ├── apps/');
    console.log('  │   ├── mobile/');
    console.log('  │   ├── server/');
    console.log('  │   └── web/');
    console.log('  └── packages/');
    console.log('      ├── ui/');
    console.log('      └── utils/');
  } catch (error) {
    console.error('\n❌ 创建失败：', error.message);
    process.exit(1);
  }
}

// 更新子包的 package.json
async function updateSubpackages(rootDir, packageName) {
  const subpackagesDirs = ['apps', 'packages'];
  
  for (const dir of subpackagesDirs) {
    const subpackagesPath = path.join(rootDir, dir);
    
    if (!(await fs.pathExists(subpackagesPath))) {
      continue;
    }
    
    const subdirs = await fs.readdir(subpackagesPath);
    
    for (const subdir of subdirs) {
      const packageJsonPath = path.join(subpackagesPath, subdir, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        if (packageJson.name) {
          // 提取子包原始名称
          let subPackageName = subdir;
          
          if (packageJson.name.includes('/')) {
            subPackageName = packageJson.name.split('/').pop();
          } else if (!packageJson.name.startsWith('@')) {
            subPackageName = packageJson.name;
          }
          
          // 设置为 @packageName/subPackageName（全部小写）
          packageJson.name = `@${packageName}/${subPackageName.toLowerCase()}`;
          
          // 更新依赖项
          await updatePackageDependencies(packageJson, packageName);
          
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }
      }
    }
  }
}

// 更新依赖项
async function updatePackageDependencies(packageJson, packageName) {
  const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
  
  for (const depType of dependencyTypes) {
    if (packageJson[depType]) {
      const updatedDeps = {};
      
      for (const [depName, version] of Object.entries(packageJson[depType])) {
        if (depName.startsWith('@template/')) {
          const subPackageName = depName.split('@template/')[1];
          updatedDeps[`@${packageName}/${subPackageName.toLowerCase()}`] = version;
        } else {
          updatedDeps[depName] = version;
        }
      }
      
      packageJson[depType] = updatedDeps;
    }
  }
}

// 运行脚手架
createMonorepo();