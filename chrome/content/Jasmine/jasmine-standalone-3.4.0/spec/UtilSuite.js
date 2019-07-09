
describe("constructUri", function() {
  it("returns empty string if null/empty uri is passed/ uri isn't a string", function() {
  	var nullUrl = constructUri(null);
  	var emptyUrl = constructUri("");
    var invalidUrl = constructUri(1231231);
  	expect(nullUrl).toBe(null);
  	expect(emptyUrl).toBe(null);
    expect(invalidUrl).toBe(null);
  });

  it("returns properly formatted url with a non-null, non-empty url string", function() {
  	var uri = "https://www.google.com/";
  	var properUrl = 'https://cors-anywhere.herokuapp.com/https://web.archive.org/save/' + uri;
  	expect(constructUri(uri)).toBe(properUrl);
  });
});

describe("createCORSRequest", function() {
  var getWithCreds = createCORSRequest("GET", "https://www.google.com/");
  var postWithCreds = createCORSRequest("POST", "https://www.google.com/");
  var getNullUrl = createCORSRequest("GET", null);
  var postNullUrl = createCORSRequest("POST", null);
  it("returns a valid CORS GET/POST request given a URL (either valid or invalid)", function() {
    expect(getWithCreds).toBeTruthy();
    expect(postWithCreds).toBeTruthy();
  });
  it("returns a null CORS request given a null URL", function() {
    expect(getNullUrl).toBe(null);
    expect(postNullUrl).toBe(null);
  });
});

describe("extractUrl", function() {
  var nullExtract = extractUrl(null);
  var noCloser = extractUrl("\" var redirUrl");
  var noOpener = extractUrl("var redirUrl = adfasdfadsf\" ");
  var wrongOrder = extractUrl("\"var redirUrl \"");
  var missingRedirUrl = extractUrl("\"redir\"");
  var wellFormed = extractUrl("var redirUrl = left \"uri\" right");
  it("returns null on null inputs", function() {
    expect(nullExtract).toBe(null);
  });
  it("returns null where a redirect URI cannot be found (no closing \")", function() {
    expect(missingRedirUrl).toBe(null);
  });
  it("returns null where two quotes and \"redir\" is found, but in the wrong order", function() {
    expect(wrongOrder).toBe(null);
  });

  it("returns text in between quotes of the redir variable's value", function() {
    expect(wellFormed).toBe("uri");
  });

});

describe("isWellFormedUrl", function() {
  var empty = isWellFormedUrl("");
  var nullUrl = isWellFormedUrl(null);
  var nonsenseAfterDatetime = isWellFormedUrl("/web/20190703202116/asdfasdfadsf");
  var invalidDateTime = isWellFormedUrl("/web/201945678/http://mementoweb.org/about/");
  var wellFormed = isWellFormedUrl("/web/20190703202116/http://mementoweb.org/about/");
  it("returns false on empty/null URLs", function() {
    expect(empty).toBe(false);
    expect(nullUrl).toBe(false);
  });
  it("returns false on URLs not formatted as \"/web/(14-char datetime)/(url)\"", function() {
    expect(nonsenseAfterDatetime).toBe(false);
    expect(invalidDateTime).toBe(false);
  });
  it("returns true on URLs that follow the above format", function() {
    expect(wellFormed).toBe(true);
  });
});
