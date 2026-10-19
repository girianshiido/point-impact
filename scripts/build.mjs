import {stripTypeScriptTypes} from 'node:module';
import {mkdir,readdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of await readdir('src')) if(file.endsWith('.ts')) {const text=stripTypeScriptTypes(await readFile('src/'+file,'utf8'),{mode:'strip'}).replaceAll("'./engine.ts'","'./engine.js'");await writeFile('dist/'+file.replace('.ts','.js'),text);}
await cp('public','dist',{recursive:true});console.log('Build statique prêt dans dist/.');
