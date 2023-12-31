import $ from 'jquery';
import { WOW } from './vendor/wow.min';

import detectDevice from './components/detectDevice';
import { closeModal, openModal } from './components/modal';
import {
  fieldListener, validateFields, keyField, prepField,
} from './components/inputs';
import GTMEvents from './components/gtm-events';
import generateId from './components/utils';

const GTM = new GTMEvents();
window.jQuery = window.$ = $;

/// /////// DocReady //////////
$(() => {
  detectDevice(); // videoTeaser();
  new WOW().init();
  GTM.addEventListeners();
  // gtmSet();

  const $body = document.querySelector('body');

  // открыть модалку
  $body.addEventListener('click', (e) => {
    const _cl = 'js-tryit';
    const $showPop = (e.target.classList.contains(_cl)) ? e.target : e.target.closest(`.${_cl}`);
    if ($showPop) { openModal('#req-modal-box'); }
    // let pops = document.querySelectorAll('.modal');[...pops].forEach(pop => {});
  });

  // Показать поле ИНН
  const innF = document.querySelectorAll('.js-toggle-inn'); [...innF].forEach((_btn) => {
    _btn.addEventListener('click', (bt) => {
      const _holder = document.querySelector('.js-inn-holder');
      const _v = '_visible'; const
        _innFld = document.querySelector('.js-inn');
      if (!bt.target.classList.contains('on')) { _holder.classList.add(_v); _innFld.focus(); } else {
        _holder.classList.remove(_v); _innFld.value = '';
        // focus on button form
      }
      bt.target.classList.toggle('on');
    });
  });

  // INPUTS
  fieldListener($body, ['mousemove', 'mouseover', 'mouseout', 'blur'], prepField);
  fieldListener($body, ['focus', 'click', 'beforeinput', 'keydown', 'change', 'paste'], keyField);

  // BUTTON SUBM
  const $formBtn = document.querySelectorAll('.js-new-req');
  [...$formBtn].forEach((btn) => { btn.addEventListener('click', (e) => { e.preventDefault(); trySubmit(); }); });

  function trySubmit() {
    validateFields();
    document.querySelector('.selectorinn').style.display = 'none';
    const errorsCount = document.querySelectorAll('.text-error').length;
    const formIsReady = (errorsCount === 0);
    console.log(errorsCount, formIsReady);
    if (formIsReady) {
      submitCustomFormRequest();
    } else {
      console.warn('UNREADY SUBMIT');
    }
  }

  /*  let $fish = document.querySelectorAll('.fish');
  [... $fish].forEach( (ff) => {ff.addEventListener('click',(e)=> {e.preventDefault();
    ff.classList.toggle('ss');
  });}); */
}); // end DocReady
/// ///////////////////////////

function toggleLoader() {
  const loader = document.querySelector('.loader');
  loader.classList.toggle('hidden');
}

function submitCustomFormRequest() {
  const $frm = document.querySelector('.crm-request-form');
  const $submitBtn = document.querySelector('.js-new-req');
  const innField = document.querySelector('#innField');

  const inn = (innField.value.lenght >= 10) ? innField.value : '';
  // document.querySelector('#innField').value || '';
  const name = document.querySelector('#nameField').value;
  const phone = document.querySelector('#telField').value;

  const siteId = localStorage.getItem('siteId') || 'siteMSK';
  const url = `api/customForm/submission?siteId=${siteId}&formId=CrmMyTeamRequest`;
  // const tariffFrontName = 'SMS-target';

  const requestBody = {
    MainContact: name,
    Phone: phone,
    requestCategory: '1',
    requestId: `${Date.now()}_${Math.random().toString().slice(2, 12)}`,
    region: siteId.slice(4).toLowerCase(),
    InnCompany: inn,
    AdditionalInformation: 'Подключение услуги Бизнес - чат',
    // tariffs: [{ name: tariffFrontName, }],
  };

  toggleLoader();
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ data: requestBody }),
    headers: { Accept: 'application/json, text/plain', 'Content-Type': 'application/json;charset=UTF-8' },
  })
    .then(() => { // console.log(r);
      const reqID = requestBody.requestId;
      const dataSuccess = {
        eventAction: 'send',
        eventLabel: 'checkout_business-chat-form_server_response',
        requestId: reqID,
        eventCategory: 'Conversions',
        eventContent: `business-chat_${Date.now()}${generateId(12)}`,
        eventContext: 'successful',
        transactionPaymentType: null,
        transactionShippingMethod: null,
      };
      GTM.gaPush(dataSuccess); // console.log(dataSuccess);
      closeModal('#req-modal-box');
      openModal('#succ-modal-box');
    })
    .catch(() => {
      closeModal('#req-modal-box');
      openModal('#error-modal-box');
      console.log('something wrong');
      const reqID = requestBody.requestId;
      const dataSuccess = {
        eventAction: 'send',
        eventLabel: 'checkout_business-chat-form_server_response',
        requestId: reqID,
        eventCategory: 'Conversions',
        eventContent: `shop_business-chat_${Date.now()}${generateId(12)}`,
        eventContext: 'unsuccessful',
        transactionPaymentType: null,
        transactionShippingMethod: null,
      };
      GTM.gaPush(dataSuccess);
    })
    .finally(() => toggleLoader());
}

// Scroll To
function goTo(el) {
  const offs = 0;
  const y = el.getBoundingClientRect().top + window.pageYOffset + offs;
  window.scrollTo({ top: y, behavior: 'smooth' }); // element.scrollIntoView();
}

// ONCE
function once(fn, context) {
  let result;
  return function () {
    if (fn) { result = fn.apply(context || this, arguments); fn = null; }
    return result;
  };
}
