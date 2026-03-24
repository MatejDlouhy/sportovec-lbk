// Získání přesného názvu aktuálního souboru (odstraní složky z cesty)
const currentPath = window.location.pathname;
const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

// 1. Kontrola - je-li hlasování již dokončeno, nepouštěj ho nikam jinam než na poděkování
if (sessionStorage.getItem('votingCompleted') === 'true' && currentFile !== 'podekovani.html') {
    window.location.replace('podekovani.html');
}

const isVotingPage = currentFile.includes('hlasovani-kategorie-');

// 2. KONTROLA ŠIPKY ZPĚT A PŘESKAKOVÁNÍ STRÁNEK
if (isVotingPage) {
    if (sessionStorage.getItem('votingInProgress') !== 'true') {
        // Pokud vůbec nezačal, vrať na úvod
        window.location.replace('index.html');
    } else {
        // Zkontrolujeme, na jaké stránce má uživatel správně být
        const expectedPage = sessionStorage.getItem('expectedPage');
        if (expectedPage && currentFile !== expectedPage) {
            // Pokud se pokusil jít zpět na už odeslanou kategorii, 
            // nekompromisně ho přesměrujeme vpřed. 
            // Používáme replace(), aby se mu nezahlcovala historie prohlížeče.
            window.location.replace(expectedPage);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Textová pole
    document.querySelectorAll('input[required]').forEach(function(input) {
        input.addEventListener('invalid', function(e) {
            input.setCustomValidity('Vyplňte prosím toto pole');
        });
        input.addEventListener('input', function(e) {
            input.setCustomValidity('');
        });
    });
    
    // Selecty
    document.querySelectorAll('select[required]').forEach(function(select) {
        select.addEventListener('invalid', function(e) {
            select.setCustomValidity('Vyberte prosím jednu možnost');
        });
        select.addEventListener('change', function(e) {
            select.setCustomValidity('');
        });
    });

    const form = document.getElementById('loginForm');
    if (form) {
        // Kontrola - již probíhá hlasování?
        if (sessionStorage.getItem('votingInProgress') === 'true') {
            alert('Hlasování již probíhá. Pokud chcete započít nové, zavřete prohlížeč a otevřete jej znovu.');
            form.style.pointerEvents = 'none';
            form.style.opacity = '0.5';
            return;
        }
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (form.checkValidity()) {
                localStorage.setItem('hlasovani_jmeno', document.getElementById('nameInput').value);
                localStorage.setItem('hlasovani_organizace', document.getElementById('orgInput').value);
                sessionStorage.setItem('votingInProgress', 'true');
                
                // NASTAVENÍ PRVNÍ OČEKÁVANÉ STRÁNKY PŘI PŘIHLÁŠENÍ
                sessionStorage.setItem('expectedPage', 'hlasovani-kategorie-dospeli-jednotlivci.html');
                
                window.location.href = "hlasovani-kategorie-dospeli-jednotlivci.html";
            } else {
                form.reportValidity();  
            }
        });
    }

    const votingForms = [
        { formId: 'form-dospeli-jednotlivci', buttonId: 'button2', nextPage: 'hlasovani-kategorie-dospeli-druzstva.html' },
        { formId: 'form-dospeli-druzstva', buttonId: 'button3', nextPage: 'hlasovani-kategorie-mladez-jednotlivci.html' },
        { formId: 'form-mladez-jednotlivci', buttonId: 'button4', nextPage: 'hlasovani-kategorie-mladez-druzstva.html' },
        { formId: 'form-mladez-druzstva', buttonId: 'button5', nextPage: 'hlasovani-kategorie-trener-profesional.html' },
        { formId: 'form-trener-profesional', buttonId: 'button6', nextPage: 'hlasovani-kategorie-trener-dobrovolny.html' },
        { formId: 'form-trener-dobrovolny', buttonId: 'button7', nextPage: 'hlasovani-kategorie-handicapovani-sportovci.html' },
        { formId: 'form-handicapovani-sportovci', buttonId: 'button8', nextPage: 'hlasovani-kategorie-masters.html' },
        { formId: 'form-masters', buttonId: 'button9', nextPage: 'podekovani.html' }
    ];

    // Vaši původní ochranu ponecháme jako dodatečnou pojistku pro zmatení prohlížeče
    function preventBackNavigation() {
        history.replaceState(null, document.title, location.href);
        window.addEventListener('popstate', function () {
            history.replaceState(null, document.title, location.href);
        });
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                history.replaceState(null, document.title, location.href);
            }
        });
    }
    preventBackNavigation();

    votingForms.forEach(({ formId, buttonId, nextPage }) => {
        const form = document.getElementById(formId);
        const button = document.getElementById(buttonId);
        if (form) {
            const selects = form.querySelectorAll('.select-sportovec');
            selects.forEach(select => {
                select.addEventListener('change', () => {
                    updateSelectOptions(selects);
                });
            });
            updateSelectOptions(selects);
        }
        
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (form.checkValidity()) {
                    // Blokace tlačítka, aby uživatel nemohl kliknout vícekrát během odesílání
                    button.disabled = true;
                    button.textContent = "Odesílám...";

                    let kategorie = '';
                    if (formId === 'form-dospeli-jednotlivci') kategorie = 'Dospělí_jednotlivci';
                    else if (formId === 'form-dospeli-druzstva') kategorie = 'Dospělí_družstva';
                    else if (formId === 'form-mladez-jednotlivci') kategorie = 'Mládež_jednotlivci';
                    else if (formId === 'form-mladez-druzstva') kategorie = 'Mládež_družstva';
                    else if (formId === 'form-trener-profesional') kategorie = 'Trenéři_profesionálové';
                    else if (formId === 'form-trener-dobrovolny') kategorie = 'Trenéři_dobrovolníci';
                    else if (formId === 'form-handicapovani-sportovci') kategorie = 'Handicapovaní_sportovci';
                    else if (formId === 'form-masters') kategorie = 'Masters';
                    
                    submitResults(form, kategorie, nextPage, button);
                } else {
                    form.reportValidity();
                }
            });
        }
    });

    function updateSelectOptions(selects) {
        const selectedValues = Array.from(selects)
            .map(s => s.value)
            .filter(v => v !== '');
        selects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value === '') return;
                option.hidden = selectedValues.includes(option.value) && select.value !== option.value;
            });
        });
    }

    function submitResults(form, kategorie, nextPage, button) {
        const jmeno = localStorage.getItem('hlasovani_jmeno') || '';
        const organizace = localStorage.getItem('hlasovani_organizace') || '';
        const selects = form.querySelectorAll('.select-sportovec');
        const vysledky = Array.from(selects).map(select => select.value);

        const data = {
            Kategorie: kategorie,
            Jméno: jmeno,
            Organizace: organizace,
            První_místo: vysledky[0],
            Druhé_místo: vysledky[1],
            Třetí_místo: vysledky[2],
            Čtvrté_místo: vysledky[3],
            Páté_místo: vysledky[4],
            Šesté_místo: vysledky[5],
            Sedmé_místo: vysledky[6],
            Osmé_místo: vysledky[7],
            Deváté_místo: vysledky[8],
            Desáté_místo: vysledky[9]
        };

        fetch('https://sheetdb.io/api/v1/zz3ovj855agj0', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        })
        .then(response => response.json())
        .then(() => {
            if (kategorie === 'Masters') {
                sessionStorage.setItem('votingCompleted', 'true');
            }
            
            // AKTUALIZACE OČEKÁVANÉ STRÁNKY PO ÚSPĚŠNÉM ODESLÁNÍ
            sessionStorage.setItem('expectedPage', nextPage);
            
            window.location.replace(nextPage);
        })
        .catch(() => {
            alert('Chyba při odesílání. Zkuste to prosím znovu.');
            // Odblokování tlačítka v případě chyby
            button.disabled = false;
            button.textContent = "Odeslat a pokračovat";
        });
    }
});