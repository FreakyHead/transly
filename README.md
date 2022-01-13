# Transly. i18n helper

The minimalistic library was created for parsing translations from JSON locales files and generating XLSX sheets with all of them.
And generating from XLSX file translation files in JSON.

To convert from JSONs you need to put your files in root of project to directory `translations/JSON` (you may put nested directory)

To convert from XLSX you need to put your XLSX file (translations.xlsx) in root of project to directory `translations/XLSX`

### Commands:

`npm run parse ` - parse JSON files in translations/JSON folder and generate the translation file

`npm run generate` - parse XLSX file and generate translations for each locale in the folder translations/JSON
