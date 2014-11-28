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

    colour: {type: String, enum: ['Blue', 'Brown', 'Green', 'Hazel'], form: {directive: 'fng-ui-select', theme: 'bootstrap'}}

theme defaults to select2.  Other options are bootstrap and selectize.  Bootstrap required Bootstrap 3 and will fall
back to select2.

Road map

* Introduce fng-select2 capabilities for lookup and querying the server
* Multi select

