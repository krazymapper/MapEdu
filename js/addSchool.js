// Form validation and submission handling
class SchoolForm {
  constructor() {
    this.form = document.getElementById('addSchoolForm');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.imageInput = document.getElementById('schoolImage');
    this.imagePreview = document.getElementById('imagePreview');
    this.marker = null;
    this.map = null;
    this.paypalButtonContainer = document.getElementById('paypal-button-container');
    this.customAmountInput = document.getElementById('custom_amount');
    this.donationRadios = document.querySelectorAll('input[name="donation_amount"]');
    
    this.init();
  }

  init() {
    this.initMap();
    this.setupEventListeners();
    this.setupImagePreview();
    this.setupDonationHandling();
    this.initPayPal();
  }

  initMap() {
    this.map = L.map('schoolMap').setView([9.3077, 2.3158], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e) => this.handleMapClick(e));
  }

  handleMapClick(e) {
    const { lat, lng } = e.latlng;
    
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lng.toFixed(6);
    
    if (this.marker) {
      this.marker.setLatLng(e.latlng);
    } else {
      this.marker = L.marker(e.latlng).addTo(this.map);
    }
  }

  setupImagePreview() {
    this.imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('L\'image ne doit pas dépasser 5MB');
          this.imageInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview.src = e.target.result;
          this.imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  setupEventListeners() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    this.form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => this.validateField(input));
    });
  }

  validateField(field) {
    field.classList.remove('border-red-500');
    field.nextElementSibling?.remove(); // Remove any existing error message

    if (field.hasAttribute('required') && !field.value.trim()) {
      this.showError(field, 'Ce champ est requis');
      return false;
    }

    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        this.showError(field, 'Email invalide');
        return false;
      }
    }

    if (field.type === 'tel' && field.value) {
      const phoneRegex = /^\+?[0-9]{8,}$/;
      if (!phoneRegex.test(field.value)) {
        this.showError(field, 'Numéro de téléphone invalide');
        return false;
      }
    }

    if (field.type === 'number') {
      const value = parseInt(field.value);
      if (isNaN(value) || value < 1) {
        this.showError(field, 'Veuillez entrer un nombre valide');
        return false;
      }
    }

    return true;
  }

  showError(field, message) {
    field.classList.add('border-red-500');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }

  validateForm() {
    let isValid = true;
    
    // Validate all fields
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Validate needs checkboxes
    const needs = document.querySelectorAll('input[name="needs[]"]:checked');
    if (needs.length === 0) {
      const needsContainer = document.querySelector('.needs-container');
      this.showError(needsContainer, 'Veuillez sélectionner au moins un besoin');
      isValid = false;
    }

    // Validate map location
    if (!this.marker) {
      const mapContainer = document.getElementById('schoolMap');
      this.showError(mapContainer, 'Veuillez sélectionner l\'emplacement de l\'école sur la carte');
      isValid = false;
    }

    return isValid;
  }

  setupDonationHandling() {
    // Handle custom amount input enable/disable
    this.donationRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isCustom = radio.value === 'custom';
        this.customAmountInput.disabled = !isCustom;
        
        if (isCustom) {
          this.customAmountInput.focus();
        }
        
        this.updatePayPalButton();
      });
    });

    // Handle custom amount changes
    this.customAmountInput.addEventListener('input', () => {
      if (document.getElementById('donation_custom').checked) {
        this.updatePayPalButton();
      }
    });
  }

  updatePayPalButton() {
    const selectedAmount = this.getSelectedDonationAmount();
    
    if (selectedAmount > 0) {
      this.paypalButtonContainer.classList.remove('hidden');
      // Clear existing buttons
      this.paypalButtonContainer.innerHTML = '';
      // Render new PayPal button
      this.renderPayPalButton(selectedAmount);
    } else {
      this.paypalButtonContainer.classList.add('hidden');
    }
  }

  getSelectedDonationAmount() {
    const selectedRadio = document.querySelector('input[name="donation_amount"]:checked');
    
    if (!selectedRadio || selectedRadio.value === '0') {
      return 0;
    }

    if (selectedRadio.value === 'custom') {
      const customAmount = parseFloat(this.customAmountInput.value);
      return isNaN(customAmount) ? 0 : customAmount;
    }

    return parseFloat(selectedRadio.value);
  }

  initPayPal() {
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }

    this.renderPayPalButton(0);
  }

  renderPayPalButton(amount) {
    if (amount <= 0) return;

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'donate'
      },
      
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2),
              currency_code: 'EUR'
            },
            description: 'Don pour EduMap Bénin'
          }]
        });
      },
      
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          
          // Add donation information to form data
          const donationInfo = {
            transactionId: order.id,
            amount: amount,
            status: order.status,
            payerEmail: order.payer.email_address
          };
          
          // Store donation info to be sent with form
          this.donationInfo = donationInfo;
          
          // Show success message
          this.showSuccessMessage('Merci pour votre don !', 'donation');
          
        } catch (error) {
          console.error('Error capturing PayPal order:', error);
          alert('Une erreur est survenue lors du traitement du don. Veuillez réessayer.');
        }
      },
      
      onError: (err) => {
        console.error('PayPal Error:', err);
        alert('Une erreur est survenue avec PayPal. Veuillez réessayer.');
      }
    }).render(this.paypalButtonContainer);
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    // Show loading state
    this.submitButton.disabled = true;
    this.submitButton.innerHTML = `
      <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Envoi en cours...
    `;

    try {
      // Prepare form data
      const formData = new FormData(this.form);
      
      // Add coordinates
      formData.append('latitude', document.getElementById('latitude').value);
      formData.append('longitude', document.getElementById('longitude').value);

      // Add donation information if available
      if (this.donationInfo) {
        formData.append('donation', JSON.stringify(this.donationInfo));
      }

      // Send data to server
      const response = await fetch('/api/schools', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi des données');
      }

      // Show success message
      this.showSuccessMessage('École ajoutée avec succès !', 'form');
      
      // Reset form
      this.resetForm();

    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
    } finally {
      // Reset button state
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = 'Soumettre';
    }
  }

  showSuccessMessage(message, type = 'form') {
    const successAlert = document.createElement('div');
    successAlert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    successAlert.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        ${message}
      </div>
    `;
    document.body.appendChild(successAlert);

    // Remove alert after 3 seconds
    setTimeout(() => {
      successAlert.remove();
    }, 3000);
  }

  resetForm() {
    this.form.reset();
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    this.imagePreview.src = '';
    this.imagePreview.classList.add('hidden');
    this.customAmountInput.disabled = true;
    this.paypalButtonContainer.classList.add('hidden');
    this.donationInfo = null;
  }
}

// Initialize form handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SchoolForm();
}); 