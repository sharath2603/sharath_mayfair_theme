/*----------------------------------------------
  COLLAPSABLE TABS
----------------------------------------------*/
function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}
document.querySelectorAll('[id^="Tabs-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', 'false');

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});


/*----------------------------------------------
  QUANTITY SELECTOR
----------------------------------------------*/
class WizaahQuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('wizaah-quantity-input', WizaahQuantityInput);


/*----------------------------------------------
  PRODUCT MEDIA SLIDER
----------------------------------------------*/
function initMediaSlider() {
  var sliderElement = document.querySelector('.product__media-list');
  var sliderElementCells = sliderElement ? sliderElement.querySelectorAll('.product__media-item') : [];
  
  if(!sliderElement) { return; }
 
  // For some reason, Flickity set a zero height at start, 
  // so I am pre-setting the height of first item
  var initialIndex = 0;
  var firstSlide = sliderElementCells[initialIndex];
  
  firstSlide.classList.add('is-selected');            
  firstSlide.style.height = "".concat(firstSlide.clientHeight, "px");
  
  var initFlickty = new Flickity(sliderElement, {
    accessibility: false,
    prevNextButtons: true,
    pageDots: false,
    adaptiveHeight: true,
    cellSelector: '.product__media-item',
    initialIndex: initialIndex
  });
}

initMediaSlider();


/*----------------------------------------------
  VARIANT CHANGE
----------------------------------------------*/
class WizaahVariantRadios extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }
  
  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    //this.toggleAddButton(true, '', false);

    if (!this.currentVariant) {
      //this.toggleAddButton(true, '', true);
      //this.setUnavailable();
    } else {
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }
   
  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('.product__variant'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
  
  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }
  
  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }
  
  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  
  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        /*const id = `price-${this.dataset.section}`;*/
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        /*const destination = document.getElementById(id);
        const source = html.getElementById(id);

        if (source && destination) destination.innerHTML = source.innerHTML;
        this.toggleAddButton(!this.currentVariant.available, 'SOLD OUT');*/
      });
  }
  
  /*toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = 'ADD TO CART';
    }

    if (!modifyClass) return;
  }
  
  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    if (!addButton) return;
    addButtonText.textContent = 'UNAVAILABLE';
  }*/

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('wizaah-variant-radios', WizaahVariantRadios);


/*----------------------------------------------
  PRODUCT FORM
----------------------------------------------*/
if (!customElements.get('wizaah-product-form')) {
  function fetchConfig(type = 'json') {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
    };
  }
  
  customElements.define('wizaah-product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      const submitButton = this.querySelector('[type="submit"]');
      const formData = new FormData(this.form);
      formData.append('sections_url', window.location.pathname);

      this.handleErrorMessage();
  
			fetch(window.Shopify.routes.root + 'cart/add.js', {
			  method: 'POST',
			  body: formData
			})
			.then(response => {
			  if (response.status) {
          this.handleErrorMessage(response.description);
          return;
        }
        
        document.location.href = '/cart';
         document.querySelector("wizaah-cart").refreshCart();
       document.querySelector("wizaah-cart").open();
              
			})
			.catch((error) => {
			  console.error('Error:', error);
			});
		}
    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.querySelector('.product__form-error');
      this.errorMessage = this.errorMessageWrapper.querySelector('.product__form-error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
