@echo off
echo Regenerating Prisma Client...
echo Please close any running Node.js processes manually, then press any key to continue...
pause >nul
npx prisma generate
echo Done!
pause
