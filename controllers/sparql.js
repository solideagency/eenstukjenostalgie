// Sparql queries:

var sparqlqueries = {
  url: function (query) {
    return `https://api.druid.datalegend.net/datasets/adamnet/all/services/endpoint/sparql?default-graph-uri=&query=${this.encodedquery(query)}&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on`;
  },
  encodedquery: function (query) {
    return encodeURIComponent(query);
  },
  getLocationBySearch: function (val) {
    const query = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX hg: <http://rdf.histograph.io/>
      PREFIX geo: <http://www.opengis.net/ont/geosparql#>
      SELECT ?street ?name ?wkt WHERE {
        ?street a hg:Street .
        ?street rdfs:label ?name .
        ?street geo:hasGeometry/geo:asWKT ?wkt .
        FILTER (REGEX (?street, "${val}"))
      }
    `;
    return this.url(query);
  },
  getLocationAndTimestamp: function (startyear, endyear, wkt) {
    const beginTimestamp = `${startyear}-01-01`;
    const endTimestamp = `${endyear}-12-31`;

    const query = `
      PREFIX dct: <http://purl.org/dc/terms/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX void: <http://rdfs.org/ns/void#>
      PREFIX hg: <http://rdf.histograph.io/>
      PREFIX geo: <http://www.opengis.net/ont/geosparql#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>
      SELECT ?title ?img ?start ?end ?street ?streetLabel ?wkt WHERE {
        # basic data
        ?cho dc:title ?title .
        ?cho foaf:depiction ?img .

        # temporal filter
        ?cho sem:hasBeginTimeStamp ?orgStart .
        ?cho sem:hasEndTimeStamp ?orgEnd .
        BIND (xsd:date(str(?orgStart)) AS ?start)
        BIND (xsd:date(str(?orgEnd)) AS ?end)
        FILTER BOUND (?start)
        FILTER BOUND (?end)
        FILTER (?start >= xsd:date("${beginTimestamp}") && ?end <= xsd:date("${endTimestamp}") )

        # spatial filter
        ?cho dct:spatial ?street .
        ?street a hg:Street ;
        geo:hasGeometry/geo:asWKT ?wkt ;
        rdfs:label ?streetLabel .
        BIND (bif:st_geomfromtext("${wkt}") as ?x)
        BIND (bif:st_geomfromtext(?wkt) AS ?y)
        FILTER(bif:GeometryType(?y)!='POLYGON' && bif:st_intersects(?x, ?y))
      }
      ORDER BY ?start
    `;
    return this.url(query);
  }
};

module.exports = sparqlqueries;
