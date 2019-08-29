var _ = require('underscore');

var tst = ["A", "B", "C"];

// console.log(fields(survey()))
// var fields = fields(survey())
// console.log(forward_links(fields))
var lgic = logic(survey())

console.log(all_links());


function all_links() {
  var forward = forward_links(fields(survey()))
  var brn = branches(logic(survey()))
  return _.uniq(_.flatten(forward.concat(brn)))
}


function branches(logic) {
  return _.map(logic, (b) => calc_branch(b))
}

function calc_branch(b) {
  var ref = b.ref
  return _.map(b.actions, (action) => make_link(ref, action.details.to.value))
  // ref = get_title_from_ref(l.ref)
}

function make_link(a, b) {
  return `${a} -> ${b}`
}
// function get_title_from_ref(ref) {
//
// }

function forward_links(fields) {
  var len = fields.length - 1
  return _.map(fields.slice(0, len), (field, indx) => `${field.ref} -> ${fields[indx+1].ref}`)
}

function logic(survey) {
  return survey.logic
}

function fields(survey) {
  return _.map(survey.fields, (x) => x);
}


function survey() {
  return  {
    "id": "jo8KJj",
    "title": "Branching Test",
    "theme": {
        "href": "https://api.typeform.com/themes/6lPNE6"
    },
    "workspace": {
        "href": "https://api.typeform.com/workspaces/iY5G9Y"
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
    "thankyou_screens": [
        {
            "ref": "default_tys",
            "title": "Done! Your information was sent perfectly.",
            "properties": {
                "show_button": false,
                "share_icons": false
            }
        }
    ],
    "fields": [
        {
            "id": "mk1RXcduAWKd",
            "title": "Short question test4",
            "ref": "8d6248ab-77cc-4d6a-8387-02c05eb6b46c",
            "validations": {
                "required": false
            },
            "type": "short_text"
        },
        {
            "id": "B9vOSIbvqEsh",
            "title": "When?",
            "ref": "1c44d061-eda2-4aa6-b347-34cdd6253b97",
            "properties": {
                "structure": "MMDDYYYY",
                "separator": "/"
            },
            "validations": {
                "required": false
            },
            "type": "date"
        },
        {
            "id": "EdazGT4AJb0X",
            "title": "TesTitle",
            "ref": "8dd79d05-95e1-4c9c-a7c0-6086e0e58489",
            "validations": {
                "required": false
            },
            "type": "short_text"
        },
        {
            "id": "pzWcYIv4Fzhk",
            "title": "NotDetention?",
            "ref": "19065080-f15a-4c64-8399-4c432d843f16",
            "validations": {
                "required": false
            },
            "type": "short_text"
        },
        {
            "id": "EYy2JbQU0g8B",
            "title": "BILLL",
            "ref": "02e88270-1a36-438c-b08c-8bc9acc5270b",
            "properties": {
                "alphabetical_order": false,
                "choices": [
                    {
                        "label": "Local"
                    },
                    {
                        "label": "MultiNational"
                    }
                ]
            },
            "validations": {
                "required": false
            },
            "type": "dropdown"
        },
        {
            "id": "PQUY2GGzHhLa",
            "title": "Which naational police?",
            "ref": "d6d24d19-dd8b-4a99-b7e7-74be45eb77bc",
            "validations": {
                "required": false
            },
            "type": "short_text"
        },
        {
            "id": "S6qkTwC18V4f",
            "title": "Moreaee comments?",
            "ref": "0f1b253a-3285-4bcd-a454-46d1dbb488da",
            "validations": {
                "required": false
            },
            "type": "short_text"
        }
    ],
    "logic": [
        {
            "type": "field",
            "ref": "02e88270-1a36-438c-b08c-8bc9acc5270b",
            "actions": [
                {
                    "action": "jump",
                    "details": {
                        "to": {
                            "type": "field",
                            "value": "d6d24d19-dd8b-4a99-b7e7-74be45eb77bc"
                        }
                    },
                    "condition": {
                        "op": "equal",
                        "vars": [
                            {
                                "type": "field",
                                "value": "02e88270-1a36-438c-b08c-8bc9acc5270b"
                            },
                            {
                                "type": "constant",
                                "value": "Local"
                            }
                        ]
                    }
                },
                {
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
                }
            ]
        },
        {
            "type": "field",
            "ref": "8dd79d05-95e1-4c9c-a7c0-6086e0e58489",
            "actions": [
                {
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
                }
            ]
        }
    ],
    "_links": {
        "display": "https://whistle632914.typeform.com/to/jo8KJj"
    }
}
}
