@echo off
set /p count=<.commit_count

git add .
git commit -m "%count%-v"
git push

set /a next=%count%+1
echo %next% > .commit_count
