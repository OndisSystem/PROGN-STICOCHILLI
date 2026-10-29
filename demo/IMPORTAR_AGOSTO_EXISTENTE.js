'use strict';
// Recuperar o exemplo na base SQLite já existente, sem tocar em outros meses.
const {db}=require('../server');
const {seedAugustExample}=require('./seed-example');
try{
  const result=seedAugustExample(db,{onlyFreshDatabase:false,overwrite:process.argv.includes('--sobrescrever')});
  console.log(result.created?'EXEMPLO AGOSTO IMPORTADO COM SUCESSO.':`Nenhuma alteração: ${result.reason}.`);
  if(!result.created)console.log('Se o mês já existir, faça backup antes de usar --sobrescrever.');
}catch(err){console.error('FALHA:',err.message);process.exitCode=1}
finally{db.close()}
