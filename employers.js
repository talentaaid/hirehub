"use strict";

const TALENTAA_API_URL = "https://script.google.com/macros/s/AKfycbwCEVP-4TzSNdbWOf0LamJZtRVt6yB08sX_x6tKKG1JPkuThHsQLsbK3daT8xFrnwFJ/exec";

function initializeTalentaaPage() {
  setupMobileNavigation();
  setupHiringForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTalentaaPage, { once: true });
} else {
  initializeTalentaaPage();
}

function setupMobileNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupHiringForm() {
  const form = document.getElementById("hiringForm");
  if (!form) return;

  const submitButton = form.querySelector(".submit-btn");
  const message = document.getElementById("formMessage");
  const requirements = form.querySelector('textarea[name="requirements"]');
  const counter = document.getElementById("requirementCount");

  requirements?.addEventListener("input", () => {
    if (counter) counter.textContent = String(requirements.value.length);
  });

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(message);

    if (!validateForm(form, message)) return;

    setSubmitting(submitButton, true);
    const formData = new FormData(form);
    formData.delete("consent");

    try {
      const response = await fetch(TALENTAA_API_URL, {
        method: "POST",
        body: new URLSearchParams(formData),
        redirect: "follow"
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "The request could not be submitted.");

      showMessage(message, "success", `Thank you. Your hiring request${result.request_id ? ` (${result.request_id})` : ""} has been received. Our team will contact you shortly.`);
      form.reset();
      if (counter) counter.textContent = "0";
      message?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("Talentaa form submission failed:", error);
      showMessage(message, "error", "We could not submit your request right now. Please check your connection and try again.");
    } finally {
      setSubmitting(submitButton, false);
    }
  });
}

function validateForm(form, message) {
  let firstInvalid = null;
  form.querySelectorAll(".field-error").forEach((field) => field.classList.remove("field-error"));

  form.querySelectorAll("[required]").forEach((field) => {
    const invalid = field.type === "checkbox" ? !field.checked : !String(field.value).trim();
    if (invalid) {
      field.classList.add("field-error");
      firstInvalid ||= field;
    }
  });

  const email = form.elements.email;
  const whatsapp = form.elements.whatsapp;
  const emailValue = email.value.trim();
  const whatsappValue = whatsapp.value.trim();

  if (!emailValue && !whatsappValue) {
    email.classList.add("field-error");
    whatsapp.classList.add("field-error");
    firstInvalid ||= email;
    showMessage(message, "error", "Please provide at least a company email or WhatsApp number.");
  } else if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    email.classList.add("field-error");
    firstInvalid ||= email;
    showMessage(message, "error", "Please enter a valid email address.");
  } else if (whatsappValue && !/^\+?[0-9\s().-]{8,20}$/.test(whatsappValue)) {
    whatsapp.classList.add("field-error");
    firstInvalid ||= whatsapp;
    showMessage(message, "error", "Please enter a valid WhatsApp number.");
  }

  if (firstInvalid) {
    if (!message?.textContent) showMessage(message, "error", "Please complete all required fields.");
    firstInvalid.focus();
    return false;
  }
  return true;
}

function clearFieldError(field) {
  field.classList.remove("field-error");
}

function setSubmitting(button, isSubmitting) {
  if (!button) return;
  button.disabled = isSubmitting;
  button.classList.toggle("is-loading", isSubmitting);
  button.setAttribute("aria-busy", String(isSubmitting));
}

function showMessage(element, type, text) {
  if (!element) return;
  element.className = `form-message ${type}`;
  element.textContent = text;
}

function clearMessage(element) {
  if (!element) return;
  element.className = "form-message";
  element.textContent = "";
}
