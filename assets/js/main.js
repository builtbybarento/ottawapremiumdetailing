/*
	Ottawa Premium Detailing — homepage
	Nav state, postal gate, reveal animations and the contact form.
	The booking pipeline lives in assets/js/booking.js (book.html).

	NOTE: the EMAILJS config below is duplicated in assets/js/booking.js —
	change both together.
*/

(function () {
	"use strict";

	var EMAILJS = {
		publicKey: "ZQKpwfu8STEYdc4uG",
		serviceId: "service_01aewsp",
		templateId: "template_ih0rbka",
	};

	if (window.emailjs) emailjs.init(EMAILJS.publicKey);

	/* Sticky nav shadow once the page scrolls. */
	var nav = document.getElementById("nav");
	if (nav) {
		var navTick = false;
		var setNav = function () {
			nav.classList.toggle("is-stuck", window.scrollY > 4);
			navTick = false;
		};
		window.addEventListener(
			"scroll",
			function () {
				if (!navTick) {
					navTick = true;
					requestAnimationFrame(setNav);
				}
			},
			{ passive: true }
		);
		setNav();
	}

	/* Mobile nav menu. */
	var navToggle = document.querySelector(".nav-toggle");
	if (nav && navToggle) {
		navToggle.addEventListener("click", function () {
			var open = nav.classList.toggle("is-open");
			navToggle.setAttribute("aria-expanded", open ? "true" : "false");
		});
		nav.querySelectorAll(".nav-links a").forEach(function (link) {
			link.addEventListener("click", function () {
				nav.classList.remove("is-open");
				navToggle.setAttribute("aria-expanded", "false");
			});
		});
	}

	/* Reveal-on-scroll. */
	var revealEls = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window && revealEls.length) {
		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-in");
						io.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: "0px 0px -8% 0px" }
		);
		revealEls.forEach(function (el) {
			io.observe(el);
		});
	} else {
		revealEls.forEach(function (el) {
			el.classList.add("is-in");
		});
	}

	/* Postal forms: remember the code so book.html can prefill it.
	   The forms also work without JS — they submit ?postal=… to book.html. */
	var normalizePostal = function (value) {
		return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
	};

	var validPostal = function (value) {
		return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalizePostal(value));
	};

	document.querySelectorAll("[data-postal-form]").forEach(function (form) {
		form.addEventListener("submit", function () {
			var input = form.querySelector("input[name=postal]");
			var code = normalizePostal(input && input.value);
			try {
				if (code) sessionStorage.setItem("opd-postal", code);
				else sessionStorage.removeItem("opd-postal");
			} catch (err) {
				/* Storage unavailable (private mode) — the query string still works. */
			}
		});
	});

	/* Postal gate modal. Triggers keep their book.html href as a no-JS fallback. */
	var gate = document.getElementById("gate");
	if (gate) {
		var gateInput = gate.querySelector("input[name=postal]");
		var gateForm = gate.querySelector("form");
		var gateStatus = document.getElementById("gate-status");
		var lastTrigger = null;

		var openGate = function (event) {
			event.preventDefault();
			lastTrigger = event.currentTarget;
			gate.hidden = false;
			document.body.style.overflow = "hidden";
			if (gateInput) gateInput.focus();
		};

		var closeGate = function () {
			gate.hidden = true;
			document.body.style.overflow = "";
			if (lastTrigger) lastTrigger.focus();
		};

		document.querySelectorAll("[data-gate-open]").forEach(function (trigger) {
			trigger.addEventListener("click", openGate);
		});
		gate.querySelectorAll("[data-gate-close]").forEach(function (trigger) {
			trigger.addEventListener("click", closeGate);
		});
		document.addEventListener("keydown", function (event) {
			if (gate.hidden) return;
			if (event.key === "Escape") {
				closeGate();
				return;
			}
			/* Keep Tab inside the dialog while it's open. */
			if (event.key === "Tab") {
				var focusables = gate.querySelectorAll("button, input, [href]");
				if (!focusables.length) return;
				var first = focusables[0];
				var last = focusables[focusables.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		});

		/* The gate promises an area check, so don't navigate on junk input. */
		if (gateForm) {
			gateForm.addEventListener("submit", function (event) {
				if (!validPostal(gateInput && gateInput.value)) {
					event.preventDefault();
					if (gateStatus) {
						gateStatus.textContent = "Please enter a valid postal code (like K2P 1L4).";
						gateStatus.classList.add("is-error");
					}
					if (gateInput) gateInput.focus();
				}
			});
			if (gateInput) {
				gateInput.addEventListener("input", function () {
					if (gateStatus) {
						gateStatus.textContent = "";
						gateStatus.classList.remove("is-error");
					}
				});
			}
		}
	}

	/* Contact form via EmailJS. */
	var form = document.getElementById("contact-form");
	if (form) {
		var status = document.getElementById("form-status");
		var setStatus = function (message, isError) {
			if (!status) return;
			status.textContent = message;
			status.classList.toggle("is-error", !!isError);
		};

		form.addEventListener("submit", function (event) {
			event.preventDefault();

			if (!form.reportValidity()) return;
			if (!window.emailjs) {
				setStatus("Sending is unavailable right now. Please call (613) 700-8188.", true);
				return;
			}

			var button = form.querySelector("button[type=submit]");
			if (button) button.disabled = true;
			setStatus("Sending…");

			emailjs
				.sendForm(EMAILJS.serviceId, EMAILJS.templateId, form)
				.then(function () {
					form.reset();
					setStatus("Thanks! We'll get back to you shortly.");
				})
				.catch(function (error) {
					console.error("EmailJS error:", error);
					setStatus("Sorry, that didn't send. Please call (613) 700-8188 instead.", true);
				})
				.then(function () {
					if (button) button.disabled = false;
				});
		});
	}
})();
