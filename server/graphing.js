var _ = require('underscore');

exports.getGraph = function() {

  survey = branchSurvey();

  var nodes = _.map(survey.fields, (field) => field.ref)

  var straight = [];
  nodes.forEach(function (element, i){ straight.push(`${element}  -> ${nodes[i + 1]}`)});

  var logic = _.map(survey.logic, (lg) => {
    var from = lg.ref
    return _.map(lg.actions, (action) => {
        var to = action.details.to.value;
        return "" + to + " -> " + from
    })
  })

  console.log(nodes)
  console.log(straight)
  console.log(_.flatten(logic))

}

function branchSurvey() {
  return {
      "id": "jo8KJj",
      "title": "Branching Test",
      "theme": {
          "href": "https:\/\/api.typeform.com\/themes\/6lPNE6"
      },
      "workspace": {
          "href": "https:\/\/api.typeform.com\/workspaces\/iY5G9Y"
      },
      "settings": {
          "is_public": true,
          "is_trial": false,
          "language": "en",
          "progress_bar": "percentage",
          "show_progress_bar": true,
          "show_typeform_branding": true,
          "meta": {
              "allow_indexing": false
          }
      },
      "thankyou_screens": [{
          "ref": "default_tys",
          "title": "Done! Your information was sent perfectly.",
          "properties": {
              "show_button": false,
              "share_icons": false
          }
      }],
      "fields": [{
          "id": "mk1RXcduAWKd",
          "title": "Who?",
          "ref": "8d6248ab-77cc-4d6a-8387-02c05eb6b46c",
          "validations": {
              "required": false
          },
          "type": "short_text"
      }, {
          "id": "B9vOSIbvqEsh",
          "title": "When?",
          "ref": "1c44d061-eda2-4aa6-b347-34cdd6253b97",
          "properties": {
              "structure": "MMDDYYYY",
              "separator": "\/"
          },
          "validations": {
              "required": false
          },
          "type": "date"
      }, {
          "id": "Zegeywcd6hqd",
          "title": "What?",
          "ref": "605a1d03-8dd6-49fe-8313-477a37b118bd",
          "properties": {
              "randomize": false,
              "allow_multiple_selection": true,
              "allow_other_choice": false,
              "vertical_alignment": true,
              "choices": [{
                  "id": "N8xaJjZEsGnv",
                  "ref": "bef3eece-00e0-4802-bbda-c4466480f819",
                  "label": "Asylum"
              }, {
                  "id": "c8N2oEoevi7p",
                  "ref": "eaeda2f8-7766-4b7f-be4f-0bac9edcc8b8",
                  "label": "Police brutality"
              }, {
                  "id": "fsh1iujiH0Nr",
                  "ref": "f4b25a38-b0d7-45ac-9448-c709760a1de2",
                  "label": "Sanitation"
              }]
          },
          "validations": {
              "required": false
          },
          "type": "multiple_choice"
      }, {
          "id": "EdazGT4AJb0X",
          "title": "Where from\/to?",
          "ref": "8dd79d05-95e1-4c9c-a7c0-6086e0e58489",
          "validations": {
              "required": false
          },
          "type": "short_text"
      }, {
          "id": "pzWcYIv4Fzhk",
          "title": "Detention?",
          "ref": "19065080-f15a-4c64-8399-4c432d843f16",
          "validations": {
              "required": false
          },
          "type": "short_text"
      }, {
          "id": "EYy2JbQU0g8B",
          "title": "Which police?",
          "ref": "02e88270-1a36-438c-b08c-8bc9acc5270b",
          "properties": {
              "alphabetical_order": false,
              "choices": [{
                  "label": "Local"
              }, {
                  "label": "National"
              }]
          },
          "validations": {
              "required": false
          },
          "type": "dropdown"
      }, {
          "id": "PQUY2GGzHhLa",
          "title": "Which local police?",
          "ref": "d6d24d19-dd8b-4a99-b7e7-74be45eb77bc",
          "validations": {
              "required": false
          },
          "type": "short_text"
      }, {
          "id": "S6qkTwC18V4f",
          "title": "Additional comments?",
          "ref": "0f1b253a-3285-4bcd-a454-46d1dbb488da",
          "validations": {
              "required": false
          },
          "type": "short_text"
      }],
      "logic": [{
          "type": "field",
          "ref": "605a1d03-8dd6-49fe-8313-477a37b118bd",
          "actions": [{
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "8dd79d05-95e1-4c9c-a7c0-6086e0e58489"
                  }
              },
              "condition": {
                  "op": "is",
                  "vars": [{
                      "type": "field",
                      "value": "605a1d03-8dd6-49fe-8313-477a37b118bd"
                  }, {
                      "type": "choice",
                      "value": "bef3eece-00e0-4802-bbda-c4466480f819"
                  }]
              }
          }, {
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "02e88270-1a36-438c-b08c-8bc9acc5270b"
                  }
              },
              "condition": {
                  "op": "is",
                  "vars": [{
                      "type": "field",
                      "value": "605a1d03-8dd6-49fe-8313-477a37b118bd"
                  }, {
                      "type": "choice",
                      "value": "eaeda2f8-7766-4b7f-be4f-0bac9edcc8b8"
                  }]
              }
          }, {
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "0f1b253a-3285-4bcd-a454-46d1dbb488da"
                  }
              },
              "condition": {
                  "op": "always",
                  "vars": []
              }
          }]
      }, {
          "type": "field",
          "ref": "02e88270-1a36-438c-b08c-8bc9acc5270b",
          "actions": [{
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "d6d24d19-dd8b-4a99-b7e7-74be45eb77bc"
                  }
              },
              "condition": {
                  "op": "equal",
                  "vars": [{
                      "type": "field",
                      "value": "02e88270-1a36-438c-b08c-8bc9acc5270b"
                  }, {
                      "type": "constant",
                      "value": "Local"
                  }]
              }
          }, {
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "0f1b253a-3285-4bcd-a454-46d1dbb488da"
                  }
              },
              "condition": {
                  "op": "always",
                  "vars": []
              }
          }]
      }, {
          "type": "field",
          "ref": "8dd79d05-95e1-4c9c-a7c0-6086e0e58489",
          "actions": [{
              "action": "jump",
              "details": {
                  "to": {
                      "type": "field",
                      "value": "19065080-f15a-4c64-8399-4c432d843f16"
                  }
              },
              "condition": {
                  "op": "always",
                  "vars": []
              }
          }]
      }],
      "_links": {
          "display": "https:\/\/whistle632914.typeform.com\/to\/jo8KJj"
      }
  }
}
