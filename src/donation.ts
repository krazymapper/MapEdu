import { DonationInfo, DonationResponse } from './types/donation';

class DonationHandler {
  private modal: HTMLElement;
  private donateButton: HTMLElement;
  private navDonateButton: HTMLElement;
  private navDonateButtonMobile: HTMLElement;
  private closeButton: HTMLElement;
  private customAmountInput: HTMLInputElement;
  private donationRadios: NodeListOf<HTMLInputElement>;
  private paypalButtonContainer: HTMLElement;

  constructor() {
    const modal = document.getElementById('donationModal');
    const donateButton = document.getElementById('donateButton');
    const navDonateButton = document.getElementById('navDonateButton');
    const navDonateButtonMobile = document.getElementById('navDonateButtonMobile');
    const closeButton = document.getElementById('closeDonationModal');
    const customAmountInput = document.getElementById('custom_amount') as HTMLInputElement;
    const paypalButtonContainer = document.getElementById('paypal-button-container');

    if (!modal || !donateButton || !closeButton || !customAmountInput || !paypalButtonContainer || !navDonateButton || !navDonateButtonMobile) {
      throw new Error('Required DOM elements not found');
    }

    this.modal = modal;
    this.donateButton = donateButton;
    this.navDonateButton = navDonateButton;
    this.navDonateButtonMobile = navDonateButtonMobile;
    this.closeButton = closeButton;
    this.customAmountInput = customAmountInput;
    this.donationRadios = document.querySelectorAll<HTMLInputElement>('input[name="donation_amount"]');
    this.paypalButtonContainer = paypalButtonContainer;
    
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.initPayPal();
  }

  private setupEventListeners(): void {
    // Open modal from all donation buttons
    const openModal = () => {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
    };

    this.donateButton.addEventListener('click', openModal);
    this.navDonateButton.addEventListener('click', openModal);
    this.navDonateButtonMobile.addEventListener('click', openModal);

    // Close modal
    this.closeButton.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e: MouseEvent) => {
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
      const customRadio = document.getElementById('amount_custom') as HTMLInputElement;
      if (customRadio?.checked) {
        this.updatePayPalButton();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  private closeModal(): void {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.resetForm();
  }

  private resetForm(): void {
    this.donationRadios.forEach(radio => radio.checked = false);
    this.customAmountInput.value = '';
    this.customAmountInput.disabled = true;
    this.paypalButtonContainer.innerHTML = '';
  }

  private getSelectedAmount(): number {
    const selectedRadio = document.querySelector<HTMLInputElement>('input[name="donation_amount"]:checked');
    
    if (!selectedRadio) {
      return 0;
    }

    if (selectedRadio.value === 'custom') {
      const amount = parseFloat(this.customAmountInput.value);
      return isNaN(amount) ? 0 : amount;
    }

    return parseFloat(selectedRadio.value);
  }

  private updatePayPalButton(): void {
    const amount = this.getSelectedAmount();
    
    // Clear existing buttons
    this.paypalButtonContainer.innerHTML = '';
    
    if (amount > 0) {
      this.renderPayPalButton(amount);
    }
  }

  private initPayPal(): void {
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }
  }

  private renderPayPalButton(amount: number): void {
    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'donate'
      },

      createOrder: (_data: paypal.CreateOrderData, actions: paypal.CreateOrderActions) => {
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

      onApprove: async (_data: paypal.OnApproveData, actions: paypal.OnApproveActions) => {
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

      onError: (err: Error) => {
        console.error('PayPal Error:', err);
        alert('Une erreur est survenue avec PayPal. Veuillez réessayer.');
      }
    }).render(this.paypalButtonContainer);
  }

  private async recordDonation(donationInfo: DonationInfo): Promise<void> {
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationInfo)
      });

      const data: DonationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record donation');
      }
    } catch (error) {
      console.error('Error recording donation:', error);
      // Don't show error to user since payment was successful
    }
  }

  private showSuccessMessage(): void {
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