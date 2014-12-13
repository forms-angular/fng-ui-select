# fng-ui-select

Plugin for forms-angular that adds ui-select (https://github.com/angular-ui/ui-select) support.

## Usage

    bower install fng-ui-select

Add the following lines to your index.html (or equivalent) file.  Wiredep may do this for you if you are using the right
build tools).

    <link rel="stylesheet" href="/bower_components/angular-ui-select/dist/select.css">
    <script src="/bower_components/angular-ui-select/dist/select.js"></script>
    <script src="/bower_components/fng-ui-select/fng-ui-select.js"></script>

In your Mongoose schemas you can set up fields like this:

    colour: {type: String, enum: ['Blue', 'Brown', 'Green', 'Hazel'], form: {directive: 'fng-ui-select'}}
    lookup: {type: Schema.Types.ObjectId, ref: 'anotherModel', form: {directive: 'fng-ui-select'}},

Options can be added to a fngUiSelect object with the form object as follows:

* _theme_ defaults to _select2_.  Other options are _bootstrap_ and _selectize_.  Bootstrap required Bootstrap 3 and will fall
back to _select2_.

## Tests

e2e tests require the forms-angular website (https://github.com/forms-angular/website)

## Road map

tests:
  multiple control enum
  multiple control lookup from query list
  multiple control lookup from ajax

single control multi lookup from query list and test - or inhibit it
