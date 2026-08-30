/*
	Ottawa Premium Detailing — booking pipeline (book.html)

	Six steps: location → vehicle → services → add-ons → schedule → contact.
	No backend: the request is emailed to us via EmailJS and we confirm the
	slot (and exact price for non-sedans) by phone or text.

	NOTE: the EMAILJS config below is duplicated in assets/js/main.js (the
	homepage contact form) — change both together.
*/

(function () {
	"use strict";

	var EMAILJS = {
		publicKey: "ZQKpwfu8STEYdc4uG",
		serviceId: "service_01aewsp",
		templateId: "template_ih0rbka",
	};

	if (window.emailjs) emailjs.init(EMAILJS.publicKey);

	var form = document.getElementById("bflow");
	if (!form) return;

	var TOTAL = 6;
	var current = 1;

	var steps = form.querySelectorAll(".bstep");
	var railItems = document.querySelectorAll("#rail [data-rail]");
	var backBtn = document.getElementById("b-back");
	var nextBtn = document.getElementById("b-next");
	var sendBtn = document.getElementById("b-send");
	var statusEl = document.getElementById("b-status");
	var doneEl = document.getElementById("b-done");
	var railEl = document.getElementById("rail");
	var postalInput = document.getElementById("b-postal");
	var areaResult = document.getElementById("area-result");
	var dateInput = document.getElementById("b-date");
	var msumBtn = document.getElementById("msummary");
	var msheet = document.getElementById("msheet");

	var STORE_KEY = "opd-booking";

	/* ---------- helpers ---------- */

	var setStatus = function (message, isError) {
		statusEl.textContent = message || "";
		statusEl.classList.toggle("is-error", !!isError);
	};

	var fieldValue = function (id) {
		var el = document.getElementById(id);
		return el ? el.value.trim() : "";
	};

	var markField = function (id, bad) {
		var el = document.getElementById(id);
		var wrap = el && el.closest(".field");
		if (wrap) wrap.classList.toggle("has-error", !!bad);
		if (el) {
			if (bad) el.setAttribute("aria-invalid", "true");
			else el.removeAttribute("aria-invalid");
		}
		return !!bad;
	};

	var focusFirstInvalid = function () {
		var bad = form.querySelector('.bstep:not([hidden]) [aria-invalid="true"]');
		if (bad) bad.focus();
	};

	var checkedInput = function (name) {
		return form.querySelector('input[name="' + name + '"]:checked');
	};

	var pickedTier = function (name) {
		var input = checkedInput(name);
		if (!input || !input.value) return null;
		return {
			level: "Level " + input.value,
			name: input.getAttribute("data-name"),
			price: parseInt(input.getAttribute("data-price"), 10) || 0,
		};
	};

	var pickedAddons = function () {
		return Array.prototype.map.call(
			form.querySelectorAll('input[name="addons"]:checked'),
			function (input) {
				return {
					name: input.value,
					price: parseInt(input.getAttribute("data-price"), 10) || 0,
					from: input.hasAttribute("data-from"),
				};
			}
		);
	};

	var normalizePostal = function (value) {
		return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
	};

	var formatPostal = function (value) {
		var code = normalizePostal(value);
		return code.length > 3 ? code.slice(0, 3) + " " + code.slice(3) : code;
	};

	var validPostal = function (value) {
		return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalizePostal(value));
	};

	/* Ottawa and the immediate surroundings: K0A rural ring, K1x/K2x city, K4A/B/C. */
	var inServiceArea = function (value) {
		return /^(K0A|K1[A-Z]|K2[A-Z]|K4[ABC])/.test(normalizePostal(value));
	};

	var formatDate = function (value) {
		if (!value) return "";
		var parts = value.split("-");
		if (parts.length !== 3) return value;
		var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
		return date.toLocaleDateString("en-CA", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	/* ---------- estimate + summary ---------- */

	/* Each summary value renders in several places (desktop sidebar, mobile
	   sheet, done-screen recap), so targets are [data-sum] attributes, not ids.
	   The no-op guard keeps the aria-live total from re-announcing on every
	   keystroke. */
	var setText = function (key, text) {
		document.querySelectorAll('[data-sum="' + key + '"]').forEach(function (el) {
			if (el.textContent !== text) el.textContent = text;
		});
	};

	var renderSummary = function () {
		var interior = pickedTier("interior");
		var exterior = pickedTier("exterior");
		var addons = pickedAddons();
		var vehicleInput = checkedInput("vehicle");
		var vehicle = vehicleInput ? vehicleInput.value : "";

		var total = 0;
		var anything = false;
		if (interior) {
			total += interior.price;
			anything = true;
		}
		if (exterior) {
			total += exterior.price;
			anything = true;
		}
		addons.forEach(function (addon) {
			total += addon.price;
			anything = true;
		});

		var isFrom =
			(vehicle && vehicle !== "Sedan") ||
			addons.some(function (addon) {
				return addon.from;
			});

		var totalText = anything ? (isFrom ? "from $" : "$") + total : "—";
		var note = "";
		if (anything && vehicle && vehicle !== "Sedan") {
			var vehicleName = vehicle === "SUV" ? "SUV" : vehicle.toLowerCase();
			note = "Sedan pricing shown — we confirm the exact price for your " + vehicleName + " before any work starts.";
		} else if (anything && isFrom) {
			note = "We confirm the exact price before any work starts.";
		}

		setText("postal", formatPostal(postalInput.value) || "—");
		setText("vehicle", vehicle || "—");
		setText("interior", interior ? interior.name + " — $" + interior.price : "—");
		setText("exterior", exterior ? exterior.name + " — $" + exterior.price : "—");
		setText(
			"addons",
			addons.length
				? addons
						.map(function (addon) {
							return addon.name + " — " + (addon.from ? "from $" : "$") + addon.price;
						})
						.join(", ")
				: "—"
		);

		var when = formatDate(dateInput.value);
		var timeInput = checkedInput("timewindow");
		if (timeInput && timeInput.value !== "Flexible") {
			when = (when ? when + ", " : "") + timeInput.value;
		} else if (!when) {
			when = "Flexible";
		}
		setText("when", when || "—");

		setText("total", totalText);
		setText("note", note);

		var mnote = document.getElementById("m-note");
		if (mnote) {
			var mnoteText = anything
				? note
					? "exact price confirmed with you"
					: ""
				: "pick your services to see a price";
			if (mnote.textContent !== mnoteText) mnote.textContent = mnoteText;
		}
	};

	/* ---------- persistence (survives Back-button trips to the homepage) ---------- */

	var saveState = function () {
		try {
			var data = {
				postal: normalizePostal(postalInput.value),
				vehicle: checkedInput("vehicle") ? checkedInput("vehicle").value : "",
				interior: checkedInput("interior") ? checkedInput("interior").value : "",
				exterior: checkedInput("exterior") ? checkedInput("exterior").value : "",
				addons: pickedAddons().map(function (a) {
					return a.name;
				}),
				date: dateInput.value,
				timewindow: checkedInput("timewindow") ? checkedInput("timewindow").value : "",
				name: fieldValue("b-name"),
				tel: fieldValue("b-tel"),
				email: fieldValue("b-email"),
				address: fieldValue("b-address"),
				notes: fieldValue("b-notes"),
			};
			sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
			if (data.postal) sessionStorage.setItem("opd-postal", data.postal);
		} catch (err) {
			/* Storage unavailable — nothing to do. */
		}
	};

	var restoreState = function () {
		var data;
		try {
			data = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
		} catch (err) {
			data = null;
		}
		if (!data) return;

		var check = function (selector) {
			var input = form.querySelector(selector);
			if (input) input.checked = true;
		};
		if (data.vehicle) check('input[name="vehicle"][value="' + data.vehicle + '"]');
		if (data.interior) check('input[name="interior"][value="' + data.interior + '"]');
		if (data.exterior) check('input[name="exterior"][value="' + data.exterior + '"]');
		(data.addons || []).forEach(function (name) {
			form.querySelectorAll('input[name="addons"]').forEach(function (input) {
				if (input.value === name) input.checked = true;
			});
		});
		if (data.date) dateInput.value = data.date;
		if (data.timewindow) check('input[name="timewindow"][value="' + data.timewindow + '"]');
		["name", "tel", "email", "address", "notes"].forEach(function (key) {
			var el = document.getElementById("b-" + key);
			if (el && data[key]) el.value = data[key];
		});
	};

	/* ---------- steps ---------- */

	var show = function (step, skipHistory) {
		current = Math.min(Math.max(step, 1), TOTAL);

		steps.forEach(function (fieldset) {
			fieldset.hidden = +fieldset.getAttribute("data-step") !== current;
		});
		railItems.forEach(function (item) {
			var n = +item.getAttribute("data-rail");
			var done = n < current;
			item.classList.toggle("is-active", n === current);
			item.classList.toggle("is-done", done);
			if (n === current) item.setAttribute("aria-current", "step");
			else item.removeAttribute("aria-current");
			var btn = item.querySelector(".rail-step");
			if (btn) btn.disabled = !done;
		});

		backBtn.hidden = current === 1;
		nextBtn.hidden = current === TOTAL;
		sendBtn.hidden = current !== TOTAL;
		setStatus("");

		if (!skipHistory && window.history && history.pushState) {
			if (history.state && typeof history.state.step === "number") {
				history.pushState({ step: current }, "");
			} else {
				history.replaceState({ step: current }, "");
			}
		}

		window.scrollTo({ top: 0, behavior: "auto" });
		var active = form.querySelector('.bstep[data-step="' + current + '"]');
		var first = active && active.querySelector("input:not([type=hidden]), select, textarea");
		if (first) first.focus({ preventScroll: true });
	};

	window.addEventListener("popstate", function (event) {
		if (event.state && typeof event.state.step === "number" && !form.hidden) {
			show(event.state.step, true);
		}
	});

	/* The rail: completed steps are clickable shortcuts back. */
	railItems.forEach(function (item) {
		var btn = item.querySelector(".rail-step");
		if (btn) {
			btn.addEventListener("click", function () {
				var n = +item.getAttribute("data-rail");
				if (n < current) show(n);
			});
		}
	});

	var validate = function (step) {
		switch (step) {
			case 1:
				if (markField("b-postal", !validPostal(postalInput.value))) {
					return "Please enter a valid postal code.";
				}
				return "";
			case 2:
				return checkedInput("vehicle") ? "" : "Pick your vehicle type to continue.";
			case 3:
				return pickedTier("interior") || pickedTier("exterior")
					? ""
					: "Pick at least one interior or exterior package.";
			case 5:
				if (dateInput.value && dateInput.min && dateInput.value < dateInput.min) {
					markField("b-date", true);
					return "The earliest we can come is tomorrow.";
				}
				markField("b-date", false);
				return "";
			case 6:
				var bad = false;
				bad = markField("b-name", !fieldValue("b-name")) || bad;
				bad = markField("b-tel", !fieldValue("b-tel")) || bad;
				var email = fieldValue("b-email");
				bad = markField("b-email", !email || !/^\S+@\S+\.\S+$/.test(email)) || bad;
				bad = markField("b-address", !fieldValue("b-address")) || bad;
				return bad ? "Please fill in the highlighted fields." : "";
			default:
				return "";
		}
	};

	backBtn.addEventListener("click", function () {
		show(current - 1);
	});

	nextBtn.addEventListener("click", function () {
		var problem = validate(current);
		if (problem) {
			setStatus(problem, true);
			focusFirstInvalid();
			return;
		}
		show(current + 1);
	});

	form.addEventListener("change", function () {
		syncChecked();
		renderSummary();
		saveState();
	});
	form.addEventListener("input", function (event) {
		if (event.target === postalInput) renderArea();
		var wrap = event.target.closest && event.target.closest(".field");
		if (wrap) wrap.classList.remove("has-error");
		if (event.target.removeAttribute) event.target.removeAttribute("aria-invalid");
		setStatus("");
		renderSummary();
		saveState();
	});

	/* Enter inside a field advances instead of submitting early. */
	form.addEventListener("submit", function (event) {
		event.preventDefault();
		if (current !== TOTAL) {
			nextBtn.click();
			return;
		}
		submitRequest();
	});

	/* Mobile summary bar expands into the full breakdown. */
	if (msumBtn && msheet) {
		msumBtn.addEventListener("click", function () {
			var open = msheet.hidden;
			msheet.hidden = !open;
			msumBtn.setAttribute("aria-expanded", open ? "true" : "false");
		});
	}

	/* ---------- area check ---------- */

	var renderArea = function () {
		var code = normalizePostal(postalInput.value);
		areaResult.className = "area-result";
		areaResult.textContent = "";
		if (!validPostal(code)) return;

		if (inServiceArea(code)) {
			areaResult.classList.add("is-ok");
			areaResult.textContent = "✓ " + formatPostal(code) + " is in our service area — you're good to go.";
		} else if (code.charAt(0) === "K") {
			areaResult.classList.add("is-ok");
			areaResult.textContent =
				formatPostal(code) + " is on the edge of our usual area — send the request and we'll confirm we can reach you.";
		} else {
			areaResult.classList.add("is-warn");
			areaResult.textContent =
				formatPostal(code) + " looks outside Ottawa. Send the request anyway, or call (613) 700-8188 and we'll see what we can do.";
		}
	};

	/* ---------- selected/focus states (fallback for browsers without :has()) ---------- */

	var syncChecked = function () {
		form.querySelectorAll(".opt, .opt-card").forEach(function (label) {
			var input = label.querySelector("input");
			if (input) label.classList.toggle("is-checked", input.checked);
		});
	};

	form.addEventListener("focusin", function (event) {
		var label = event.target.closest && event.target.closest(".opt, .opt-card");
		if (label) label.classList.add("is-focus");
	});
	form.addEventListener("focusout", function (event) {
		var label = event.target.closest && event.target.closest(".opt, .opt-card");
		if (label) label.classList.remove("is-focus");
	});

	/* ---------- submit ---------- */

	var submitRequest = function () {
		var problem = validate(TOTAL);
		if (problem) {
			setStatus(problem, true);
			focusFirstInvalid();
			return;
		}
		if (!window.emailjs) {
			setStatus("Booking is unavailable right now. Please call (613) 700-8188.", true);
			return;
		}

		var interior = pickedTier("interior");
		var exterior = pickedTier("exterior");
		var addons = pickedAddons();
		var vehicleInput = checkedInput("vehicle");
		var timeInput = checkedInput("timewindow");
		var totalEl = document.querySelector('[data-sum="total"]');

		var lines = ["NEW BOOKING REQUEST", ""];
		var line = function (label, value) {
			if (value) lines.push(label + ": " + value);
		};
		var service = function (tier) {
			return tier ? tier.level + " " + tier.name + " — $" + tier.price : "None";
		};

		line("Postal code", formatPostal(postalInput.value));
		line("In service area", inServiceArea(postalInput.value) ? "Yes" : "NO — outside usual area");
		line("Vehicle", vehicleInput && vehicleInput.value);
		line("Interior", service(interior));
		line("Exterior", service(exterior));
		line(
			"Add-ons",
			addons.length
				? addons
						.map(function (addon) {
							return addon.name + " (" + (addon.from ? "from $" : "$") + addon.price + ")";
						})
						.join("; ")
				: "None"
		);
		line("Estimated total", totalEl ? totalEl.textContent : "");
		lines.push("");
		line("Preferred date", formatDate(dateInput.value) || "Flexible");
		line("Time window", timeInput ? timeInput.value : "");
		lines.push("");
		line("Name", fieldValue("b-name"));
		line("Phone", fieldValue("b-tel"));
		line("Email", fieldValue("b-email"));
		line("Address", fieldValue("b-address"));
		line("Notes", fieldValue("b-notes"));

		var params = {
			name: fieldValue("b-name"),
			email: fieldValue("b-email"),
			tel: fieldValue("b-tel"),
			message: lines.join("\n"),
		};

		sendBtn.disabled = true;
		setStatus("Sending…");

		emailjs
			.send(EMAILJS.serviceId, EMAILJS.templateId, params)
			.then(function () {
				setStatus("");
				form.hidden = true;
				railEl.hidden = true;
				doneEl.hidden = false;
				if (msumBtn) msumBtn.hidden = true;
				if (msheet) msheet.hidden = true;
				try {
					sessionStorage.removeItem(STORE_KEY);
				} catch (err) {
					/* ignore */
				}
				doneEl.focus();
			})
			.catch(function (error) {
				console.error("EmailJS error:", error);
				setStatus("Sorry, that didn't send. Please call (613) 700-8188 instead.", true);
			})
			.then(function () {
				sendBtn.disabled = false;
			});
	};

	/* ---------- init ---------- */

	/* Earliest bookable date is tomorrow. */
	if (dateInput) {
		var tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		var pad = function (n) {
			return (n < 10 ? "0" : "") + n;
		};
		dateInput.min =
			tomorrow.getFullYear() + "-" + pad(tomorrow.getMonth() + 1) + "-" + pad(tomorrow.getDate());
	}

	/* Prefill answers saved earlier this session (Back-button safety net). */
	restoreState();

	/* Postal: an explicit ?postal= (even empty) wins over anything stored. */
	var query = new URLSearchParams(location.search);
	var postal = "";
	if (query.has("postal")) {
		postal = normalizePostal(query.get("postal"));
	} else {
		postal = normalizePostal(postalInput.value);
		if (!postal) {
			try {
				postal = normalizePostal(sessionStorage.getItem("opd-postal"));
			} catch (err) {
				postal = "";
			}
		}
	}
	if (postal) {
		postalInput.value = formatPostal(postal);
		renderArea();
	}

	/* Preselect services and vehicle from links like book.html?pre=interior:2,exterior:1&vehicle=SUV. */
	var check = function (selector) {
		var input = form.querySelector(selector);
		if (input) input.checked = true;
	};
	(query.get("pre") || "").split(",").forEach(function (token) {
		var parts = token.split(":");
		if (parts.length === 2 && (parts[0] === "interior" || parts[0] === "exterior")) {
			check('input[name="' + parts[0] + '"][value="' + parts[1].replace(/[^0-9]/g, "") + '"]');
		}
	});
	if (query.get("vehicle")) {
		check('input[name="vehicle"][value="' + query.get("vehicle").replace(/[^A-Za-z]/g, "") + '"]');
	}

	syncChecked();
	renderSummary();

	/* Skip the location step only when the postal code is valid AND in our
	   service area — everyone else needs to see the area-check message. */
	if (postal && validPostal(postal) && inServiceArea(postal)) {
		show(2);
	} else {
		show(1);
	}
})();
