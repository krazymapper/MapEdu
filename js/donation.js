class DonationHandler {
  constructor() {
    this.modal = document.getElementById('donationModal');
    this.donateButton = document.getElementById('donateButton');
    this.closeButton = document.getElementById('closeDonationModal');
    this.customAmountInput = document.getElementById('custom_amount');
    this.donationRadios = document.querySelectorAll('input[name="donation_amount"]');
    this.paypalButtonContainer = document.getElementById('paypal-button-container');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initPayPal();
  }

  setupEventListeners() {
    // Open modal
    this.donateButton.addEventListener('click', () => {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
    });

    // Close modal
    this.closeButton.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Handle custom amount input
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

    this.customAmountInput.addEventListener('input', () => {
      if (document.getElementById('amount_custom').checked) {
        this.updatePayPalButton();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.resetForm();
  }

  resetForm() {
    this.donationRadios.forEach(radio => radio.checked = false);
    this.customAmountInput.value = '';
    this.customAmountInput.disabled = true;
    this.paypalButtonContainer.innerHTML = '';
  }

  getSelectedAmount() {
    const selectedRadio = document.querySelector('input[name="donation_amount"]:checked');
    
    if (!selectedRadio) {
      return 0;
    }

    if (selectedRadio.value === 'custom') {
      const amount = parseFloat(this.customAmountInput.value);
      return isNaN(amount) ? 0 : amount;
    }

    return parseFloat(selectedRadio.value);
  }

  updatePayPalButton() {
    const amount = this.getSelectedAmount();
    
    // Clear existing buttons
    this.paypalButtonContainer.innerHTML = '';
    
    if (amount > 0) {
      this.renderPayPalButton(amount);
    }
  }

  initPayPal() {
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }
  }

  renderPayPalButton(amount) {
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
          this.showSuccessMessage();
          this.closeModal();
          
          // Optional: Send donation info to your server
          await this.recordDonation({
            transactionId: order.id,
            amount: amount,
            status: order.status,
            payerEmail: order.payer.email_address
          });
          
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

  async recordDonation(donationInfo) {
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationInfo)
      });

      if (!response.ok) {
        throw new Error('Failed to record donation');
      }
    } catch (error) {
      console.error('Error recording donation:', error);
      // Don't show error to user since payment was successful
    }
  }

  showSuccessMessage() {
    const successAlert = document.createElement('div');
    successAlert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    successAlert.innerHTML = `
      <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Merci pour votre don !
    `;
    document.body.appendChild(successAlert);

    setTimeout(() => {
      successAlert.remove();
    }, 3000);
  }
}

// Initialize donation handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DonationHandler();
}); 