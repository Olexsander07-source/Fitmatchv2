import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
// ===================================================== // MANICURE SALON — SUPABASE // =====================================================
const SUPABASE_URL = "https://ypbhcgcwkpiujcakvaji.supabase.co"; const SUPABASE_ANON_KEY = "sb_publishable_Lsrk07A5aXJH7YypVR8QGQ_TQPwhfOV";
const supabase = createClient( SUPABASE_URL, SUPABASE_ANON_KEY );
// ===================================================== // СОСТОЯНИЕ // =====================================================
let services = []; let masters = []; let currentUser = null;
// ===================================================== // БЕЗОПАСНЫЙ HTML // =====================================================
function esc(value) {
return String(value ?? "").replace( /[&<>"']/g, function (char) {
  const chars = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return chars[char];
}
);
}
// ===================================================== // ИНИЦИАЛЫ // =====================================================
function initials(name) {
return String(name || "") .trim() .split(/\s+/) .map(function (word) {
  return word[0] || "";

})
.slice(0, 2)
.join("")
.toUpperCase();
}
// ===================================================== // ЦЕНА // =====================================================
function priceText(service) {
const price = Number(service.price || 0);
return €${price.toFixed(0)};
}
// ===================================================== // ДЛИТЕЛЬНОСТЬ // =====================================================
function durationText(service) {
const duration = Number(service.duration || 0);
if (!duration) { return ""; }
if (duration < 60) { return ${duration} мин; }
const hours = Math.floor(duration / 60);
const minutes = duration % 60;
if (minutes === 0) { return ${hours} ч; }
return ${hours} ч ${minutes} мин;
}
// ===================================================== // ПОКАЗ СТРАНИЦЫ // =====================================================
function showPage(id) {
document .querySelectorAll(".page") .forEach(function (page) {
  page.classList.remove("active");

});
const page = document.getElementById(id);
if (page) { page.classList.add("active"); }
const nav = document.getElementById("mainNav");
if (nav) { nav.classList.remove("mobile-open"); }
window.scrollTo({ top: 0, behavior: "smooth" });
}
// ===================================================== // МОДАЛЬНОЕ ОКНО // =====================================================
function toggleModal(id, show) {
const modal = document.getElementById(id);
if (modal) {
modal.classList.toggle(
  "show",
  show
);
}
}
// ===================================================== // СООБЩЕНИЯ // =====================================================
function showMessage( id, text, isError = false ) {
const element = document.getElementById(id);
if (!element) { return; }
element.textContent = text;
element.className = isError ? "error" : "success";
}
// ===================================================== // ЗАГРУЗКА ДАННЫХ // =====================================================
async function loadData() {
// --------------------------------------------------- // УСЛУГИ // ---------------------------------------------------
const servicesResult = await supabase .from("services") .select("*") .eq("active", true) .order("sort_order", { ascending: true });
if (servicesResult.error) {
console.error(
  "Ошибка загрузки услуг:",
  servicesResult.error
);

throw servicesResult.error;
}
services = servicesResult.data || [];
renderServices();
// --------------------------------------------------- // МАСТЕРА // ---------------------------------------------------
const mastersResult = await supabase .from("masters") .select("*") .eq("active", true) .order("sort_order", { ascending: true });
if (mastersResult.error) {
console.error(
  "Ошибка загрузки мастеров:",
  mastersResult.error
);

masters = [];
} else {
masters =
  mastersResult.data || [];
}
renderMasters();
renderTopMasters();
populateBookingServices();
populateBookingMasters();
}
// ===================================================== // КАРТОЧКА УСЛУГИ // =====================================================
function createServiceCard(service) {
const card = document.createElement("article");
card.className = "service-card";
card.innerHTML = `
${
  service.image
    ? `
      <div class="service-image">

        <img
          src="${esc(service.image)}"
          alt="${esc(service.name)}"
          loading="lazy"
        >

      </div>
    `
    : ""
}


<div class="service-content">

  <h3>
    ${esc(service.name)}
  </h3>


  ${
    service.description
      ? `
        <p>
          ${esc(service.description)}
        </p>
      `
      : ""
  }


  <div class="service-meta">

    <strong>
      ${priceText(service)}
    </strong>


    ${
      durationText(service)
        ? `
          <span>
            ${durationText(service)}
          </span>
        `
        : ""
    }

  </div>


  <button
    class="btn btn-primary service-book-btn"
    type="button"
  >
    Записаться
  </button>

</div>
`;
const button = card.querySelector( ".service-book-btn" );
if (button) {
button.addEventListener(
  "click",
  function () {

    openBooking(
      service.id
    );

  }
);
}
return card;
}
// ===================================================== // УСЛУГИ // =====================================================
function renderServices() {
const containers = [
"homeServices",
"servicesList"
];
containers.forEach( function (id) {
  const container =
    document.getElementById(id);


  if (!container) {
    return;
  }


  container.replaceChildren(
    ...services.map(
      createServiceCard
    )
  );

}
);
}
// ===================================================== // КАРТОЧКА МАСТЕРА // =====================================================
function createMasterCard(master) {
const card = document.createElement("article");
card.className = "master-card";
card.innerHTML = `
<div class="master-avatar">

  ${
    master.photo
      ? `
        <img
          src="${esc(master.photo)}"
          alt="${esc(master.name)}"
          loading="lazy"
        >
      `
      : `
        ${esc(
          initials(master.name)
        )}
      `
  }

</div>


<h3>
  ${esc(master.name)}
</h3>


${
  master.specialization
    ? `
      <p>
        ${esc(
          master.specialization
        )}
      </p>
    `
    : ""
}


${
  master.experience
    ? `
      <div class="tag">
        Опыт: ${esc(
          master.experience
        )}
      </div>
    `
    : ""
}


<button
  class="btn btn-primary master-book-btn"
  type="button"
>
  Записаться
</button>
`;
const button = card.querySelector( ".master-book-btn" );
if (button) {
button.addEventListener(
  "click",
  function () {

    openBooking(
      null,
      master.id
    );

  }
);
}
return card;
}
// ===================================================== // МАСТЕРА // =====================================================
function renderMasters() {
const container = document.getElementById( "mastersList" );
if (!container) { return; }
container.replaceChildren( ...masters.map( createMasterCard ) );
}
// ===================================================== // ЛУЧШИЕ МАСТЕРА // =====================================================
function renderTopMasters() {
const container = document.getElementById( "topMasters" );
if (!container) { return; }
const top = masters .slice(0, 3);
container.replaceChildren( ...top.map( createMasterCard ) );
}
// ===================================================== // ЗАПОЛНЕНИЕ УСЛУГ В ФОРМЕ ЗАПИСИ // =====================================================
function populateBookingServices() {
const select = document.getElementById( "bookingService" );
if (!select) { return; }
const previousValue = select.value;
select.innerHTML = `
<option value="">
  Выберите услугу
</option>
`;
services.forEach( function (service) {
  const option =
    new Option(

      `${service.name} — ${priceText(service)}${
        durationText(service)
          ? ` · ${durationText(service)}`
          : ""
      }`,

      service.id

    );


  select.add(option);

}
);
if ( [...select.options].some( function (option) {
    return (
      option.value ===
      previousValue
    );

  }
)
) {
select.value =
  previousValue;
}
}
// ===================================================== // ЗАПОЛНЕНИЕ МАСТЕРОВ В ФОРМЕ ЗАПИСИ // =====================================================
function populateBookingMasters() {
const select = document.getElementById( "bookingMaster" );
if (!select) { return; }
const previousValue = select.value;
select.innerHTML = `
<option value="">
  Любой мастер
</option>
`;
masters.forEach( function (master) {
  select.add(

    new Option(
      master.name,
      master.id
    )

  );

}
);
if ( [...select.options].some( function (option) {
    return (
      option.value ===
      previousValue
    );

  }
)
) {
select.value =
  previousValue;
}
}
// ===================================================== // ОТКРЫТИЕ ЗАПИСИ // =====================================================
function openBooking( serviceId = null, masterId = null ) {
const serviceSelect = document.getElementById( "bookingService" );
const masterSelect = document.getElementById( "bookingMaster" );
if (serviceSelect && serviceId) {
serviceSelect.value =
  String(serviceId);
}
if (masterSelect && masterId) {
masterSelect.value =
  String(masterId);
}
toggleModal( "bookingModal", true );
}
// ===================================================== // ФОРМА ЗАПИСИ // =====================================================
function initBookingForm() {
const form = document.getElementById( "bookingForm" );
if (!form) { return; }
form.addEventListener( "submit",
async function (event) {

  event.preventDefault();


  const formData =
    new FormData(
      event.currentTarget
    );


  const serviceId =
    formData.get(
      "service"
    );


  const masterId =
    formData.get(
      "master"
    );


  const date =
    String(
      formData.get(
        "date"
      ) || ""
    ).trim();


  const time =
    String(
      formData.get(
        "time"
      ) || ""
    ).trim();


  const name =
    String(
      formData.get(
        "name"
      ) || ""
    ).trim();


  const phone =
    String(
      formData.get(
        "phone"
      ) || ""
    ).trim();


  const comment =
    String(
      formData.get(
        "comment"
      ) || ""
    ).trim()
    || null;


  if (
    !serviceId ||
    !date ||
    !time ||
    !name ||
    !phone
  ) {

    showMessage(
      "bookingMessage",
      "Заполни все обязательные поля.",
      true
    );

    return;

  }


  const bookingData = {

    service_id:
      serviceId,

    master_id:
      masterId || null,

    booking_date:
      date,

    booking_time:
      time,

    client_name:
      name,

    client_phone:
      phone,

    client_comment:
      comment,

    user_id:
      currentUser
        ? currentUser.id
        : null,

    status:
      "new"

  };


  const response =
    await supabase
      .from("bookings")
      .insert(
        bookingData
      );


  if (response.error) {

    console.error(
      "Ошибка записи:",
      response.error
    );


    showMessage(
      "bookingMessage",
      "Не удалось отправить запись. Попробуй ещё раз или свяжись с салоном.",
      true
    );

    return;

  }


  showMessage(
    "bookingMessage",
    "Заявка отправлена! Салон свяжется с вами для подтверждения."
  );


  form.reset();


  setTimeout(
    function () {

      toggleModal(
        "bookingModal",
        false
      );

    },
    1500
  );

}
);
}
// ===================================================== // ОТЗЫВЫ // =====================================================
async function loadReviews() {
const container = document.getElementById( "reviewsList" );
if (!container) { return; }
const result = await supabase .from("reviews") .select( rating, text, created_at ) .order( "created_at", { ascending: false } ) .limit(20);
if (result.error) {
console.error(
  "Ошибка загрузки отзывов:",
  result.error
);

return;
}
const reviews = result.data || [];
container.replaceChildren();
if (!reviews.length) {
const empty =
  document.createElement("p");


empty.className =
  "lead";


empty.textContent =
  "Отзывы пока не добавлены.";


container.appendChild(
  empty
);


return;
}
reviews.forEach( function (review) {
  const element =
    document.createElement(
      "article"
    );


  element.className =
    "review";


  element.innerHTML = `

    <div>

      ⭐ ${Number(
        review.rating || 0
      )}/5

    </div>


    <p>

      ${esc(
        review.text ||
        ""
      )}

    </p>

  `;


  container.appendChild(
    element
  );

}
);
}
// ===================================================== // ДОБАВЛЕНИЕ ОТЗЫВА // =====================================================
function initReviewForm() {
const form = document.getElementById( "reviewForm" );
if (!form) { return; }
form.addEventListener( "submit",
async function (event) {

  event.preventDefault();


  if (!currentUser) {

    toggleModal(
      "modal",
      true
    );


    showMessage(
      "authMessage",
      "Чтобы оставить отзыв, войди в аккаунт.",
      true
    );


    return;

  }


  const formData =
    new FormData(
      event.currentTarget
    );


  const rating =
    Number(
      formData.get(
        "rating"
      )
    );


  const text =
    String(
      formData.get(
        "text"
      ) || ""
    ).trim();


  if (
    rating < 1 ||
    rating > 5
  ) {

    showMessage(
      "reviewMessage",
      "Выбери оценку от 1 до 5.",
      true
    );

    return;

  }


  const response =
    await supabase
      .from("reviews")
      .insert({

        user_id:
          currentUser.id,

        rating:
          rating,

        text:
          text || null

      });


  if (response.error) {

    if (
      response.error.code ===
      "23505"
    ) {

      showMessage(
        "reviewMessage",
        "Ты уже оставлял отзыв.",
        true
      );

    } else {

      showMessage(
        "reviewMessage",
        "Не удалось отправить отзыв.",
        true
      );

    }

    return;

  }


  showMessage(
    "reviewMessage",
    "Спасибо! Отзыв отправлен."
  );


  form.reset();


  await loadReviews();

}
);
}
// ===================================================== // АВТОРИЗАЦИЯ // =====================================================
async function refreshUser() {
const response = await supabase.auth.getUser();
if (response.error) {
console.warn(
  "Auth:",
  response.error.message
);


currentUser =
  null;
} else {
currentUser =
  response.data.user ||
  null;
}
const button = document.getElementById( "authBtn" );
if (!button) { return; }
if (currentUser) {
const email =
  currentUser.email || "";


const name =
  email.split("@")[0] ||
  "Пользователь";


button.textContent =
  `Выйти (${name})`;
} else {
button.textContent =
  "Войти";
}
button.onclick = async function () {
  if (currentUser) {

    const response =
      await supabase.auth.signOut();


    if (response.error) {

      alert(
        response.error.message
      );

      return;

    }


    currentUser =
      null;


    button.textContent =
      "Войти";


    return;

  }


  toggleModal(
    "modal",
    true
  );

};
}
// ===================================================== // ВХОД // =====================================================
function initAuthForm() {
const form = document.getElementById( "authForm" );
if (!form) { return; }
form.addEventListener( "submit",
async function (event) {

  event.preventDefault();


  const email =
    document
      .getElementById(
        "authEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "authPassword"
      )
      .value;


  const response =
    await supabase.auth
      .signInWithPassword({

        email:
          email,

        password:
          password

      });


  if (response.error) {

    showMessage(
      "authMessage",
      response.error.message,
      true
    );

    return;

  }


  currentUser =
    response.data.user ||
    null;


  await refreshUser();


  showMessage(
    "authMessage",
    "Вход выполнен."
  );


  setTimeout(
    function () {

      toggleModal(
        "modal",
        false
      );

    },
    500
  );

}
);
}
// ===================================================== // РЕГИСТРАЦИЯ // =====================================================
function initSignup() {
const button = document.getElementById( "signupBtn" );
if (!button) { return; }
button.addEventListener( "click",
async function () {

  const email =
    document
      .getElementById(
        "authEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "authPassword"
      )
      .value;


  if (
    !email ||
    !password
  ) {

    showMessage(
      "authMessage",
      "Введи email и пароль.",
      true
    );

    return;

  }


  const response =
    await supabase.auth
      .signUp({

        email:
          email,

        password:
          password

      });


  showMessage(

    "authMessage",

    response.error

      ? response.error.message

      : "Регистрация выполнена. Проверь email.",

    Boolean(
      response.error
    )

  );

}
);
}
// ===================================================== // ЗАБЫЛ ПАРОЛЬ // =====================================================
function initForgotPassword() {
const button = document.getElementById( "forgotPasswordBtn" );
if (!button) { return; }
button.addEventListener( "click",
async function () {

  const email =
    document
      .getElementById(
        "authEmail"
      )
      .value
      .trim();


  if (!email) {

    showMessage(
      "authMessage",
      "Сначала введи свой email.",
      true
    );

    return;

  }


  const response =
    await supabase.auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            window.location.origin +
            window.location.pathname
        }
      );


  if (response.error) {

    showMessage(
      "authMessage",
      response.error.message,
      true
    );

    return;

  }


  showMessage(
    "authMessage",
    "Письмо для восстановления пароля отправлено."
  );

}
);
}
// ===================================================== // НОВЫЙ ПАРОЛЬ // =====================================================
function initResetPassword() {
const form = document.getElementById( "resetPasswordForm" );
const cancel = document.getElementById( "resetCancel" );
if (cancel) {
cancel.addEventListener(
  "click",

  function () {

    toggleModal(
      "resetPasswordModal",
      false
    );

  }
);
}
if (!form) { return; }
form.addEventListener( "submit",
async function (event) {

  event.preventDefault();


  const password =
    document
      .getElementById(
        "newPassword"
      )
      .value;


  const confirm =
    document
      .getElementById(
        "confirmPassword"
      )
      .value;


  if (
    password.length < 6
  ) {

    showMessage(
      "resetMessage",
      "Пароль должен содержать минимум 6 символов.",
      true
    );

    return;

  }


  if (
    password !== confirm
  ) {

    showMessage(
      "resetMessage",
      "Пароли не совпадают.",
      true
    );

    return;

  }


  const response =
    await supabase.auth
      .updateUser({
        password:
          password
      });


  if (response.error) {

    showMessage(
      "resetMessage",
      response.error.message,
      true
    );

    return;

  }


  showMessage(
    "resetMessage",
    "Пароль успешно изменён."
  );


  setTimeout(
    async function () {

      toggleModal(
        "resetPasswordModal",
        false
      );


      window.location.hash =
        "";


      await refreshUser();

    },
    800
  );

}
);
}
// ===================================================== // ПРОВЕРКА RECOVERY MODE // =====================================================
function checkRecoveryMode() {
const hash = window.location.hash;
if ( hash.includes( "type=recovery" ) ) {
toggleModal(
  "resetPasswordModal",
  true
);
}
}
// ===================================================== // НАВИГАЦИЯ // =====================================================
function initNavigation() {
const logo = document.getElementById( "logo" );
if (logo) {
logo.addEventListener(
  "click",

  function () {

    showPage(
      "home"
    );

  }
);
}
document .querySelectorAll( "[data-nav]" ) .forEach( function (button) {
    button.addEventListener(
      "click",

      function () {

        showPage(
          button.dataset.nav
        );

      }
    );

  }
);
const bookingButtons = document.querySelectorAll( "[data-booking]" );
bookingButtons.forEach( function (button) {
  button.addEventListener(
    "click",

    function () {

      openBooking();

    }
  );

}
);
const servicesButton = document.getElementById( "chooseServiceBtn" );
if (servicesButton) {
servicesButton.addEventListener(
  "click",

  function () {

    showPage(
      "services"
    );

  }
);
}
}
// ===================================================== // МОДАЛЬНЫЕ ОКНА // =====================================================
function initModals() {
const modalCancel = document.getElementById( "modalCancel" );
if (modalCancel) {
modalCancel.addEventListener(
  "click",

  function () {

    toggleModal(
      "modal",
      false
    );

  }
);
}
const bookingCancel = document.getElementById( "bookingCancel" );
if (bookingCancel) {
bookingCancel.addEventListener(
  "click",

  function () {

    toggleModal(
      "bookingModal",
      false
    );

  }
);
}
document .querySelectorAll( ".modal" ) .forEach( function (modal) {
    modal.addEventListener(
      "click",

      function (event) {

        if (
          event.target ===
          modal
        ) {

          toggleModal(
            modal.id,
            false
          );

        }

      }
    );

  }
);
}
// ===================================================== // МОБИЛЬНОЕ МЕНЮ // =====================================================
function initMobileMenu() {
const hamburger = document.getElementById( "hamburger" );
const nav = document.getElementById( "mainNav" );
if ( !hamburger || !nav ) { return; }
hamburger.addEventListener( "click",
function () {

  nav.classList.toggle(
    "mobile-open"
  );

}
);
}
// ===================================================== // AUTH STATE // =====================================================
function initAuthState() {
supabase.auth.onAuthStateChange( function (event, session) {
  currentUser =
    session
      ? session.user
      : null;


  refreshUser();


  if (
    event ===
    "PASSWORD_RECOVERY"
  ) {

    toggleModal(
      "resetPasswordModal",
      true
    );

  }

}
);
}
// ===================================================== // ЗАПУСК // =====================================================
async function init() {
// Навигация initNavigation();
// Модальные окна initModals();
// Мобильное меню initMobileMenu();
// Авторизация initAuthForm(); initSignup(); initForgotPassword(); initResetPassword(); initAuthState();
// Запись initBookingForm();
// Отзывы initReviewForm();
// Recovery checkRecoveryMode();
try {
await refreshUser();

await loadData();

await loadReviews();
} catch (error) {
console.error(
  "MANICURE SALON ERROR:",
  error
);


const container =
  document.getElementById(
    "servicesList"
  );


if (container) {

  container.innerHTML = `

    <p class="error">

      Не удалось загрузить данные сайта.

      ${esc(
        error.message ||
        error
      )}

    </p>

  `;

}
}
}
init();
