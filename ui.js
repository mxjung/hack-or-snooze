$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");

  // Adding global variable for user actions, nav submit, nav favorites and nav stories buttons
  const $userActions = $("#user-actions");
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $navStories = $("#nav-stories");
  const $favoritesList = $("#favorited-articles");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event Handler for Submit Story Button
   */

  $navSubmit.on("click", function () {
    // Show the Login and Create Account Forms
    $submitForm.slideToggle();
  });

  /**
 * Event Handler for Submit New Story Form Button
 */

  $submitForm.on("submit", async function () {
    // Show the Login and Create Account Forms
    let $submitAuthor = $("#author").val();
    let $submitTitle = $("#title").val();
    let $submitUrl = $("#url").val();

    let $submitObject = {
      "author": $submitAuthor,
      "title": $submitTitle,
      "url": $submitUrl
    };

    await storyList.addStory(currentUser, $submitObject);
    await generateStories();
  });


  /**
   * Event Handler for Nav Favorites
   */

  $navFavorites.on("click", function () {
    // Show the Login and Create Account Forms
    $allStoriesList.hide();
    $favoritesList.show();
    generateFavorites();
  });

  /**
   * Event Handler for Clicking Login
   */

  // $navLogin.on("click", function() {
  //   // Show the Login and Create Account Forms
  //   $loginForm.slideToggle();
  //   $createAccountForm.slideToggle();
  //   $allStoriesList.toggle();
  // });



  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");


    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }

    $allStoriesList.on('click', '.fa-star', starButtonHandler);
  }

  async function starButtonHandler(evt) {
    const storyId = evt.target.id.slice(5, evt.target.id.length);
    // Make evt.target into jQuery object
    // "use strict" above js file to make sure you don't accidently initialize global variables
    const starButton = $(evt.target);
    // let starClass = starButton.classList.value;

    // hasClass has to have comma separated classes to check for multiple classes
    if (starButton.hasClass("far", "fa-star")) {
      starButton.removeClass("far");
      starButton.addClass("fas");
      await currentUser.addFav(currentUser.username, storyId, currentUser.loginToken);
    } else {
      starButton.removeClass("fas");
      starButton.addClass("far");
    }
  }



  /**
   * A function to render HTML for an individual favorite Story instance
   */
  async function generateFavorites() {
    currentUser = await currentUser.updateFav(currentUser.loginToken, currentUser.username);

    // loop through all of our favorite stories and generate HTML for them
    for (let favStory of currentUser.favorites) {
      console.log(favStory);
      const result = generateStoryHTML(favStory);
      $favoritesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // let star = $('<i class="far fa-star"></i>');
    // star.on('click', function () {console.log('hi')});

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="far fa-star" id='star-${story.storyId}'></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    //showing the userActions global var
    $userActions.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
