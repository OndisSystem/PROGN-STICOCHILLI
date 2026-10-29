@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo IMPORTAR EXEMPLO DE AGOSTO / 2026
if not exist node_modules\nul echo O sistema usa apenas bibliotecas embutidas no Node.js.
node demo\IMPORTAR_AGOSTO_EXISTENTE.js
if errorlevel 1 echo Ocorreu uma falha na importacao. Confira o banco e suas configuracoes.
echo.
pause
