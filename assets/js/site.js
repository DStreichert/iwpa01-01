"use strict";

/**
 * Adds the attribute required to the fields to be filled if value = pickup, if not it is removed.
 * @param {String} value The value of the select box handover type
 */
function change_handover_type_requirements(value) {
    let formPickupAddressFields = document.getElementsByClassName("form-pickup-address-fields");
    if (value === "pickup") {
        for (let i = 0; i < formPickupAddressFields.length; i++) {
            formPickupAddressFields[i].setAttribute("required", "true");
        }
        document.getElementById("pickup_datetime").setAttribute("required", "true");
    } else {
        for (let i = 0; i < formPickupAddressFields.length; i++) {
            formPickupAddressFields[i].removeAttribute("required");
        }
        document.getElementById("pickup_datetime").removeAttribute("required");
    }
}

/**
 * Shows the fields that to be filled if value = pickup, if not they are hidden.
 * @param {String} value The value of the select box handover type
 */
function change_handover_type_show_fieldsets(value) {
    if (value === "pickup") {
        document.getElementById("form-fieldset-pickup-address").style.display = "block";
        document.getElementById("form-fieldset-datetime").style.display = "flex";
    } else {
        document.getElementById("form-fieldset-pickup-address").style.display = "none";
        document.getElementById("form-fieldset-datetime").style.display = "none";
    }
}

/**
 * Executes the two functions change_handover_type_requirements and change_handover_type_show_fieldsets
 */
function change_handover_type() {
    let formSelectHandover = document.getElementById("formSelectHandover");
    change_handover_type_requirements(formSelectHandover.value);
    change_handover_type_show_fieldsets(formSelectHandover.value);
}

/**
 * Loads the file and places the lines in the select box
 * @param {String} file The file name of the file to load into the select box
 * @param {String} selectFieldName The attribute value of the attribute Name of the select box
 */
async function loadSelect(file, selectFieldName) {
    fetch(window.location.pathname + file)
        .then(response => response.text())
        .then((data) => {
            let selectField = document.getElementById(selectFieldName);
            selectField.options.remove(0);
            if (selectField.type === "select-one") {
                selectField.options[selectField.options.length] = new Option("Bitte auswählen", "", true, true);
            }
            data.split("\n").forEach((e) => {
                selectField.options[selectField.options.length] = new Option(e, e);
            });
        });
}

/**
 * Executed when the DOMContentLoaded event occurs
 */
function start() {
    // Get the container element
    var navContainer = document.getElementById("navcol-5");

    // Get all links with class="nav-link" inside the container
    var navLinks = navContainer.getElementsByClassName("nav-link");

    var currentActiveLink = navContainer.getElementsByClassName("active");
    currentActiveLink[0].className = currentActiveLink[0].className.replace(" active", "");
    // Loop through the links and add the active class to the current/clicked link
    for (var i = 0; i < navLinks.length; i++) {
        if (window.location.pathname.split("/").slice(-1)[0] === navLinks[i].getAttribute("href")) {
            navLinks[i].className += " active";
        }
    }
    let registrationform = document.getElementById("registrationform");
    if (registrationform !== null) {
        loadSelect("kleiderarten.txt", "clothing_types");
        loadSelect("krisengebiete.txt", "crisis_areas");
        let date = new Date();
        // Minimum pickup time is set to now
        document.getElementById("pickup_datetime").min = date.toISOString().substring(0, 10) + "T" + date.toLocaleTimeString().substring(0, 5);
        change_handover_type();
        registrationform.onsubmit = function () {
            try {
                let currentDateTime = new Date();
                if (document.getElementById("formSelectHandover").value === "pickup") {
                    // Check whether the zip code is nearby
                    const plz = "12";
                    let alertMessage;
                    let pickupPostalCode = document.getElementById("pickup_address_postal_code");
                    let pickupDatetime = document.getElementById("pickup_datetime");
                    // Form data is validated
                    if (pickupPostalCode.value.substring(0, 2) !== plz) {
                        alertMessage = "Die Abholadresse ist zu weit entfernt. Bitte übergeben Sie uns Ihre Spende daher in der Geschäftsstelle.";
                    } else if (pickupDatetime.valueAsDate.getDay() % 6 === 0) {
                        alertMessage = "Die Abholzeit darf kein Tag an einem Wochenende sein. Bitte geben Sie einen Wochentag ein oder übergeben Sie uns Ihre Spende in der Geschäftsstelle.";
                    } else if (pickupDatetime.valueAsDate.getTime() <= (currentDateTime.getTime() - (pickupDatetime.valueAsDate.getTimezoneOffset() * 60 * 1000))) {
                        alertMessage = "Die Abholzeit darf nicht in der Vergangenheit liegen. Bitte geben Sie eine zukünftige Zeit ein oder übergeben Sie uns Ihre Spende in der Geschäftsstelle.";
                    }
                    if (alertMessage) {
                        document.getElementById("form-alert-text").innerText = alertMessage;
                        document.getElementById("form-alert").style.display = "inherit";
                        return false;
                    }
                } else {
                    // Put the current date in the field
                    document.getElementById("pickup_datetime").value = currentDateTime.toISOString().substring(0, 10) + "T" + currentDateTime.toLocaleTimeString().substring(0, 5);
                }
                // Data entered in the form is transferred to an object
                let intermediateObject = {};
                let formData = new FormData(registrationform);
                formData.forEach((value, key) => {
                    if (!intermediateObject.hasOwnProperty(key)) {
                        intermediateObject[key] = value;
                        return;
                    }
                    if (!Array.isArray(intermediateObject[key])) {
                        intermediateObject[key] = [intermediateObject[key]];
                    }
                    intermediateObject[key].push(value);
                });
                // Form data is converted into a JSON string and this is stored in localStorage
                localStorage.setItem("registrationform", JSON.stringify(intermediateObject));
                if (window.location.hostname === "dstreichert.github.io") {
                    let path = window.location.pathname.split("/").slice(0);
                    path[path.length - 1] = "registrierungsbestaetigung.html";
                    window.location.pathname = path.join("/");
                    return false;
                } else {
                    return true;
                }
            } catch (error) {
                console.error(error);
                return false;
            }
        };
    } else if (document.getElementById("registrationconfirmation") !== null) {
        // Saved form data is converted back into a JSON string
        let registrationformData = JSON.parse(localStorage.getItem("registrationform"));
        // The entered form data is inserted into the appropriate elements for display
        document.getElementById("formSelectHandoverText").innerText = registrationformData.formSelectHandover === "pickup" ? "Abholung" : "Übergabe an der Geschäftsstelle";
        document.getElementById("clothing_types").innerText = typeof registrationformData.clothing_types === "object" ? registrationformData.clothing_types.join(" ") : registrationformData.clothing_types;
        document.getElementById("crisis_areas").innerText = registrationformData.crisis_areas;
        document.getElementById("pickup_address_name").innerText = registrationformData.pickup_address_name;
        document.getElementById("pickup_address_street").innerText = registrationformData.pickup_address_street;
        document.getElementById("pickup_address_postal_code").innerText = registrationformData.pickup_address_postal_code;
        document.getElementById("pickup_address_city").innerText = registrationformData.pickup_address_city;
        document.getElementById("pickup_datetime").innerText = (new Date(registrationformData.pickup_datetime)).toLocaleString(
            "de-DE", {
            dateStyle: "full",
            timeStyle: "long"
        });
        // If pickup was selected in the form, the pickup address will be displayed, otherwise not
        if (registrationformData.formSelectHandover === "pickup") {
            document.getElementById("form-fieldset-pickup-address").style.display = "block";
        } else {
            document.getElementById("form-fieldset-pickup-address").style.display = "none";
            document.getElementById("pickup-datetime-group").firstChild.innerText = "Übergabezeit";
        }
    }
}

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", start);
} else {
    // DOMContentLoaded has already fired
    start();
}
