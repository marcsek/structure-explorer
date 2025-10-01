# Prieskumník štruktúr pre logiku prvého rádu

Tento repozitár obsahuje zdrojové súbory aplikácie Prieskumník štruktúr,
ktorá umožňuje vytvárať a upravovať štruktúry pre jazyky logiky prvého
rádu a skúmať pravdivosť formúl a hodnoty termov v nich.

## Inštalácia

Aplikácia sa dá spustiť lokálne po vykonaní nasledovných krokov:

```shell
git clone https://github.com/FMFI-UK-1-AIN-412/structure-explorer.git
cd structure-explorer
npm install
```

Po úspešnom nainštalovaní spustíme virtuálny server pomocou príkazu:

```shell
npm run dev
```

Po tomto kroku bude aplikácia bežať na porte `localhost:5173`.

## História

Aplikácia vznikla v rokoch 2017–2018 v rámci bakalárskej práce Milana Cifru
<cite>Prieskumník sémantiky logiky prvého rádu</cite>.
V rokoch 2019–2020 ju Miroslav Baluch rozšíril o grafový pohľad na štruktúry
v rámci svojej bakalárskej práce s názvom <cite>Prieskumník grafových
štruktúr pre logiku prvého rádu</cite>. V rokoch 2020–2021 Richard Tóth
pridal do prieskumníka Henkinovu-Hintikkovu hru v rámci svojej bakalárskej
práce <cite>Henkinova-Hintikkova hra v prieskumníku štruktúr</cite>.
