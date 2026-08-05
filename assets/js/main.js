/*
	Ottawa Premium Detailing
*/

(function () {
	"use strict";

	var EMAILJS = {
		publicKey: "ZQKpwfu8STEYdc4uG",
		serviceId: "service_01aewsp",
		templateId: "template_ih0rbka",
	};

	var header = document.getElementById("header");
	var banner = document.getElementById("banner");
	var form = document.getElementById("contact-form");

	/* Play the banner intro once everything has finished loading. */
	window.addEventListener("load", function () {
		setTimeout(function () {
			document.body.classList.remove("is-preload");
		}, 100);
	});

	/* The header stays out of the way while the banner fills the screen and
	   fades in once it has been scrolled past. */
	if (header && banner) {
		var pending = false;

		var update = function () {
			pending = false;
			var trigger = banner.offsetHeight - header.offsetHeight - 1;
			header.classList.toggle("is-hidden", window.scrollY < trigger);
		};

		var schedule = function () {
			if (pending) return;
			pending = true;
			requestAnimationFrame(update);
		};

		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule, { passive: true });
		update();
	}

	/* Contact form -> EmailJS. */
	if (form) {
		var status = document.getElementById("form-status");
		var submit = form.querySelector('button[type="submit"]');

		var setStatus = function (message, isError) {
			if (!status) return;
			status.textContent = message;
			status.classList.toggle("is-error", !!isError);
		};

		if (window.emailjs) emailjs.init(EMAILJS.publicKey);

		form.addEventListener("submit", function (event) {
			event.preventDefault();

			if (!window.emailjs) {
				setStatus("The form is unavailable right now. Please call (613) 700-8188.", true);
				return;
			}

			submit.disabled = true;
			setStatus("Sending…");

			emailjs
				.sendForm(EMAILJS.serviceId, EMAILJS.templateId, form)
				.then(function () {
					form.reset();
					setStatus("Thanks! Your message has been sent — we’ll be in touch shortly.");
				})
				.catch(function (error) {
					console.error("EmailJS error:", error);
					setStatus("Sorry, that didn’t send. Please call (613) 700-8188 instead.", true);
				})
				.then(function () {
					submit.disabled = false;
				});
		});
	}
})();
