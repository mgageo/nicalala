var menuHash = 'explorer';
var textHash = 'explorer';

// chargement initial
function showHome() {
  console.log("showHome()");

    // test si l'url contient des informations complémentaires
    if (document.location.hash !== '') {
        var q = document.location.hash;
        var matches = q.match(/^#([^/]+)\/(.*)/);
        if (typeof matches === 'object' && matches.length == 3) {
            menuHash = matches[1];
            textHash = matches[2];
        }
    }

    // on charge les textes
    $("#alltexts").load("details.html #details", function () {
        // une fois le chargement effectué, on peut afficher le texte d'accueil
        $('.description_lien').click(function () {});
        showText(textHash, menuHash, undefined, false, "true");
        $("#alltexts").hide();
    });

    // on charge les menus
    $("#menu").load("menus.html #menu_items", function () {
        // une fois le chargement effectué, on peut afficher la page d'accueil et etablir tous les liens
        $('.submenu_items').hide();
        showMenu(menuHash, false);
        createMenuLinks();
    });
};

// la fonction sur le click d'un menu principal
function showMenu(menuId, loadText) {
  console.log("showMenu() menuId:", menuId);
    menuHash = menuId;
    showHash();

    $('.menu_item').children('.trim').removeClass('trimactive');
    $('#' + menuId).children('.trim').addClass('trimactive');

    /// lister les destinations selectionnees
    $("#submenu").children('.submenu_items').children('.submenu_item').each(function (index) {
        setTimeout(function () {
            $(this).hide()
        }, (index + 1) * 2000);
    });
    $("#submenu").load("menus.html #menu_" + menuId, function () {
        $("#submenu").children('.submenu_items').children('.submenu_item').each(function (index) {
            setTimeout(function () {
                $(this).show()
            }, (index + 1) * 2000);
        });
        createSubmenuLinks();
    });
    // on affiche le texte d'introduction
    if (loadText) {
        showText(menuId, menuId, undefined, false, "true");
    }
    // on affiche la carte par defaut
    // showMap(menuId, markers, true);
};

//
// ...
function contains(string, subString) {
    if (string == undefined || subString == undefined || string.length == 0 || subString.length == 0) {
        return false;
    }
    return string.indexOf(subString) != -1;
};
//
// afficher le texte demandé
function showText(textId, defaultText, photo, isDestination, withMap) {
  console.log("showText() textId:", textId);

    withMap = "true";
    textHash = textId;
    showHash();
    var photoCode;
    if (photo == undefined) {
        photoCode = "";
    } else {
        photoCode = "<img src=\"" + photo + "\" width=\"100%\">";
    }
    var htmlCode = generateStartHtml(textId, photoCode, isDestination);
    // si le texte n'a pas ete rempli, on cree une page par defaut
    if (textId == undefined || (!$('#details_' + textId).length)) {
        htmlCode += generateDefaultText(defaultText);
    } else {
        htmlCode += $('#details_' + textId).html();
    }
    htmlCode += generateEndHtml();

    var description = '#details_' + textId + '_description';
    $('#text').slideToggle(500, function () {
        $('#text').removeClass("halfscreen");
        $('#text').removeClass("fullscreen");
        $('#text').addClass(withMap == "true" ? "halfscreen" : "fullscreen");
        $('#text').removeClass("nomap");
        if (withMap != "true")
            $('#text').addClass("nomap");

        $('#text').html(htmlCode);
        if (isDestination) {
            createStarLinks(defaultText);
        }
        if (textId == "contacter") {
            $("#submit_contactform").click(function () {
                sendMessage();
            });
            $("#destinations_contactform").val(listDestinations());
        }

    });
    $('#text').slideToggle(500);
    showMap(textId, true);

};
//
// mise à jour de l'url dans la barre de navigation
window.location.lasthash = [];
var dernierHash = '';
window.onhashchange = function () {
    if (document.location.hash == '') {
        return;
    }
    var q = document.location.hash;
    if (q.substring(1) == dernierHash) {
        return;
    }
    var matches = q.match(/^#([^/]+)\/(.*)/);
    if (typeof matches === 'object' && matches.length == 3) {
        menuHash = matches[1];
        textHash = matches[2];
        showText(textHash, menuHash, undefined, false, "true");
    }
}

function showHash() {
    var sHash = menuHash + "/" + textHash;
    //  var dernierHash = window.location.lasthash[window.location.lasthash.length-1];
    if (sHash != dernierHash) {
        window.location.lasthash.push(window.location.hash);
    }
    document.location.hash = sHash;
    dernierHash = sHash;
}

function listDestinations() {
    var list = "";
    $.each(destinations, function (key, val) {
        list += val.feature.properties.lieu + " ";
    });
    return list;
}

function generateStartHtml(textId, photoCode, isDestination) {
    var htmlCode = "<div id=\"details_inc\">";
    if (photoCode != "")
        htmlCode += "<div class=\"image\">" + photoCode + "</div>";
    if (isDestination) {
        htmlCode += "<div class=\"star_checked\" id=\"" + textId + "_on\"></div>";
        htmlCode += "<div class=\"star_unchecked\" id=\"" + textId + "_off\"></div>";
    }
    htmlCode += "<div class=\"description\">";
    return htmlCode;
};

/// cree une page par default quand la page est manquante
function generateDefaultText(defaultText) {
    var htmlCode = "<h1>" + defaultText + "</h1>";
    htmlCode += "<p> Page en cours de construction. </p>";
    return htmlCode;
};

function generateEndHtml() {
    return "</div></div>";
};

function generateDestinationsHtml() {
    var htmlCode = generateStartHtml("", "", false);
    htmlCode += "<h1>Liste des destinations</h1>";
    $.each(destinations, function (key, val) {
        htmlCode += "<p>" + val.feature.properties.lieu + "</p>";
    });
    htmlCode += generateEndHtml();
    return htmlCode;
};


/// Afficher les destinations selectionnees
function showItineraire() {
    /// lister les destinations selectionnees
    $('#text').slideToggle(500, function () {
        $('#text').removeClass("fullscreen");
        $('#text').addClass("halfscreen");
        $('#text').html(generateDestinationsHtml());
    });
    $('#text').slideToggle(500);

    // ne pas oublier de changer le nom de la carte
    activeMap = "itineraire";
    // affiche les markers correspondants
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    var coeff = Math.pow(Math.max(10 - map.getZoom(), 0), 1.5) / 3;
    for (var i = 0; i < destinations.length; i++) {
        destinations[i] = createMarker(destinations[i].feature, coeff);
    }

};

// Associe tous les liens
function createMenuLinks() {
    // pour les elements du menu principal, on veut charger un nouveau menu secondaire (ce qui charge aussi la carte par defaut et le texte)
    $('.menu_item').click(function () {
        showMenu(this.id, true);
    });
}

function createSubmenuLinks() {
    // pour les elements du menu secondaire, on veut charger une nouvelle carte et le texte
    $('.submenu_item').click(function () {
        $('.submenu_item').children('.trim').removeClass('trimactive');
        $(this).children('.trim').addClass('trimactive');
        if (this.id != "itineraire") {
            showText(this.id, this.id, undefined, false, this.getAttribute("data-withmap"));
            showMap(this.id, false);
        }
        // ... sauf pour l'itineraire
        $('#itineraire').click(function () {
            showItineraire();
        });
    });
}

function createTextLinks() {
    // pour les elements centre d'intérêt, on veut charger le texte
    $('.submenu_ci').each(function () {
        name = $(this).attr("name");
    });
    $('.submenu_ci').click(function () {
        //    showText(this.id, this.id, undefined, false, this.getAttribute("data-withmap"));
        //      showMap(this.id, markers, false);
    });

};

/// Ajouter les etoiles qui servent a ajouter/enlever les destinations des favoris
function createStarLinks() {
    var destination = activeMarker.feature.properties.name;
    var starOn = $('#' + destination + "_on");
    var starOff = $('#' + destination + "_off");

    // on associe un toggle
    starOn.click(function () {
        uncheckDestination(this.id);
    });
    starOff.click(function () {
        checkDestination(this.id);
    });
    if ($.inArray(activeMarker, destinations) != -1) {
        starOff.hide();
    } else {
        starOn.hide();
    }
};

/// Ajouter une destination a la liste des favoris
function checkDestination(starId) {
    // change le statut de l'etoile
    var destination = activeMarker.feature.properties.name;
    $('#' + destination + '_on').show();
    $('#' + destination + '_off').hide();
    add(activeMarker, destinations);
}

/// Enlever une destination de la liste des favoris
function uncheckDestination(starId) {
    // change le statut de l'etoile
    var destination = activeMarker.feature.properties.name;
    $('#' + destination + '_on').hide();
    $('#' + destination + '_off').show();
    remove(activeMarker, destinations);
}

/// Ajouter un element a un tableau
function add(item, array) {
    // verification superflue?
    if ($.inArray(item, array) == -1) {
        array.push(item);
    }
};

/// Enlever un element d'un tableau
function remove(item, array) {
    array.splice($.inArray(item, array), 1);
};


/// formulaire
function sendMessage() {

    /* var total = parseInt($('.rand1').html()) + parseInt($('.rand2').html());
    var total1 = $('#total').val();
    if (total != total1) {
        alert("Le total entré est incorrect");
        randomnum();
        return false;
    } else */
    {
        var name = $("#name_contactform").val();
        var email = $("#email_contactform").val();
        var message = $("#message_contactform").val();
        var destinations = $("#destinations_contactform").val();
        var contact = $("#contact_contactform").val();
        $("#returnmessage").empty(); // To empty previous error/success message.
        // Checking for blank fields.
        if (name == '' || email == '' || contact == '') {
            alert("Merci de compléter tous les champs avec un astérisque.");
        } else {
            // Returns successful data submission message when the entered information is stored in database.
            $.post("contact_form.php", {
                name1: name,
                email1: email,
                message1: message,
                destinations1: destinations,
                contact1: contact,
            }, function (data) {
                $("#returnmessage").append(data); // Append returned message to message paragraph.
                if (data == "Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.") {
                    $("#contactform")[0].reset(); // To reset form fields on success.
                }
            });
        }
    }
};

function randomnum() {
        var number1 = 5;
        var number2 = 50;
        var randomnum = (parseInt(number2) - parseInt(number1)) + 1;
        var rand1 = Math.floor(Math.random() * randomnum) + parseInt(number1);
        var rand2 = Math.floor(Math.random() * randomnum) + parseInt(number1);
        $(".rand1").html(rand1);
        $(".rand2").html(rand2);
    }
    //
    // http://stackoverflow.com/questions/25806608/how-to-detect-browser-back-button-event-cross-browser
$(function () {
    /*
     * this swallows backspace keys on any non-input element.
     * stops backspace -> back
     */
    var rx = /INPUT|SELECT|TEXTAREA/i;

    $(document).bind("keydown keypress", function (e) {
        if (e.which == 8) { // 8 == backspace
            if (!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly) {
                e.preventDefault();
            }
        }
    });
});
//
// la fonction déclenchée en fin de chargement
$(document).ready(function () {
    $(".re").click(function () {
        randomnum();
    });

    $("#submit").click(function () {

    });
    randomnum();
});