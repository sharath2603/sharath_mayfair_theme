class WizaahCart extends HTMLElement {
  constructor() {
    super();
    this.initClickEvents();
  }

  initClickEvents() {
    this.previousElementSibling.addEventListener('click', this.close);
    this.querySelector('.wizaah-cart__close').addEventListener('click', this.close);
  }

  open(){
    document.body.classList.add('overflow-hidden');
    this.closest('.wizaah-drawer').classList.add('is--open');
  }

  close(){
    document.body.classList.remove('overflow-hidden');
    this.closest('.wizaah-drawer').classList.remove('is--open');
  }

  updateQuantity(lineKey, quantity) {
    const data  = {
      id: lineKey,
      quantity: quantity
    }

    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      document.querySelector('wizaah-cart').refreshCart();
    })
  }

  refreshCart() {
    fetch(`${this.dataset.url}?section_id=${this.dataset.section}`)
    .then((response) => {
      return response.text();
    })
    .then((responseText) => {
      this.replaceCart(responseText);
    });
  }

  replaceCart(cartResponse) {
    const html = new DOMParser().parseFromString(cartResponse, 'text/html');   
    this.closest('wizaah-cart').innerHTML = html.querySelector('wizaah-cart').innerHTML;
  }
}
customElements.define('wizaah-cart', WizaahCart);



//REMOVE BUTTON
class WizaahCartItemRemove extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      const wizaahCart = this.closest('wizaah-cart');
      wizaahCart.updateQuantity(this.dataset.itemKey, 0);
    })
  }
}
customElements.define('wizaah-cart-item-remove', WizaahCartItemRemove);



//QUANTITY BUTTONS
class WizaahCartQuantity extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: false })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );

    this.input.addEventListener('change', this.onInputChange.bind(this));
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  onInputChange(event) {
    const wizaahCart = this.closest('wizaah-cart');    
    wizaahCart.updateQuantity(this.dataset.itemKey, event.target.value);
  }
}
customElements.define('wizaah-cart-quantity', WizaahCartQuantity);



//VARIANT CHANGE
class WizaahCartItemVariant extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(event) {
    this.selectedVariant = this.querySelector('select').value;
    this.currentVariant = this.getVariantData().find((variant) => {
      return variant.id == this.selectedVariant;
    });

    this.changeVariant(event);
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  changeVariant(event) {
    const itemToRemove = event.target.dataset.itemKey;
    const itemToAdd = this.currentVariant.id;

    let data = {
      updates: {
        [itemToRemove]: 0,
        [itemToAdd]: 1
      }
    }

    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      document.querySelector('wizaah-cart').refreshCart();
    });
  }
}
customElements.define('wizaah-cart-item-variant', WizaahCartItemVariant);



//UPDATING CART NOTE
class WizaahCartNote extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('change', (event) => {
      const data = { note: event.target.value };
      
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(data),
      })
    })
  }
}
customElements.define('wizaah-cart-note', WizaahCartNote);
