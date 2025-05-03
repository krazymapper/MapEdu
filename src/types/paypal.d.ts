declare namespace paypal {
  interface PayPalButtonStyle {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment' | 'subscribe' | 'donate';
    height?: number;
    tagline?: boolean;
  }

  interface CreateOrderData {
    [key: string]: any;
  }

  interface CreateOrderActions {
    order: {
      create: (orderData: any) => Promise<string>;
    };
  }

  interface OnApproveData {
    orderID: string;
    payerID: string;
    subscriptionID?: string;
  }

  interface OnApproveActions {
    order: {
      capture: () => Promise<PayPalOrder>;
    };
  }

  interface PayPalOrder {
    id: string;
    status: 'COMPLETED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
    payer: {
      email_address: string;
      payer_id: string;
      name: {
        given_name: string;
        surname: string;
      };
    };
    purchase_units: Array<{
      amount: {
        value: string;
        currency_code: string;
      };
    }>;
  }

  interface ButtonsComponent {
    render: (container: string | HTMLElement) => Promise<void>;
  }

  interface ButtonsOptions {
    style?: PayPalButtonStyle;
    createOrder?: (data: CreateOrderData, actions: CreateOrderActions) => Promise<string>;
    onApprove?: (data: OnApproveData, actions: OnApproveActions) => Promise<void>;
    onError?: (err: any) => void;
  }

  interface PayPalNamespace {
    Buttons: (options: ButtonsOptions) => ButtonsComponent;
  }
}

declare const paypal: paypal.PayPalNamespace;

interface Window {
  paypal: paypal.PayPalNamespace;
  openDonationModal: () => void;
} 