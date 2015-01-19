var _ = require('underscore');
var $ = require('jquery');
var View = require('ampersand-view');
var ModifyingInputView = require('./modifying-input-view')
var ModifyingNumberInputView = require('./modifying-number-input-view')
var StoichSpecieCollectionFormView = require('./stoich-specie-collection');
var SelectView = require('ampersand-select-view');

var katex = require('katex')

var Tests = require('./tests');
module.exports = View.extend({
    template: "<tr><button>x</button><td data-hook='name'></td><td data-hook='typeSelect'></td><td data-hook='parameter'></td><td data-hook='equation'></td><td data-hook='latex'></td><td data-hook='reactants'></td><td data-hook='products'></td></tr>",
    // Gotta have a few of these functions just so this works as a form view
    // This gets called when things update
    update: function(obj)
    {
        if(obj.name == 'type')
        {
            this.model.type = obj.value;
        } else if(obj.name == 'parameter') {
            this.model.rate = obj.value;
        }
    },
    // On any change of anything, redraw the Latex
    redrawLatex: function(obj)
    {
        var latexString = '';

        var numReactants = this.model.reactants.models.length;
        if(numReactants == 0)
        {
            latexString = '\\emptyset';
        } else {
            for(var i = 0; i < numReactants; i++)
            {
                var stoichSpecie = this.model.reactants.models[i]; 
                latexString += stoichSpecie.stoichiometry + stoichSpecie.specie.name;
                
                if(i < numReactants - 1)
                    latexString += ' + ';
            }
        }
            
        latexString += ' \\rightarrow ';

        var numProducts = this.model.products.models.length;
        if(numProducts == 0)
        {
            latexString += '\\emptyset';
        } else {
            for(var i = 0; i < numProducts; i++)
            {
                var stoichSpecie = this.model.products.models[i]; 
                latexString += stoichSpecie.stoichiometry + stoichSpecie.specie.name;
                
                if(i < numProducts - 1)
                    latexString += ' + ';
            }
        }

        katex.render(latexString, this.queryByHook('latex'));
    },
    //Start the removal process... Eventually events will cause this.remove to get called. We don't have to do it explicitly though
    removeModel: function()
    {
        this.model.collection.remove(this.model);        
    },
    bindings: {
        'model.type' : {
            type: 'switch',
            cases: {
                'massaction' : '[data-hook="parameter"]',
                'custom' : '[data-hook="equation"]'
            }
        }
    },
    render: function()
    {
        View.prototype.render.apply(this, arguments);

        this.baseModel = this.model.collection.parent;

        this.listenTo(this.model, 'change', this.redrawLatex);
        this.listenTo(this.model.reactants, 'add remove change', this.redrawLatex);
        this.listenToAndRun(this.model.products, 'add remove change', this.redrawLatex);

        this.renderSubview(
            new ModifyingInputView({
                label: 'Name',
                name: 'name',
                value: this.model.name,
                required: false,
                placeholder: 'Name',
                model : this.model,
                tests: [].concat(Tests.naming(this.model.collection, this.model))
            }), this.el.querySelector("[data-hook='name']"));

        this.renderSubview(
            new SelectView({
                label: 'Type',
                name: 'type',
                value: this.model.type,
                options: [['massaction', 'Mass action'], ['custom', 'Custom']],
                required: true,
            }), this.el.querySelector("[data-hook='typeSelect']"));

        this.renderSubview(
            new SelectView({
                label: 'Parameter',
                name: 'parameter',
                value: this.model.rate,
                options: this.baseModel.parameters,
                required: false,
                idAttribute: 'cid',
                textAttribute: 'name',
                yieldModel: true
            }), this.el.querySelector("[data-hook='parameter']"));

        this.renderSubview(
            new ModifyingInputView({
                label: 'Equation',
                name: 'equation',
                value: this.model.equation,
                required: false,
                placeholder: '',
                model : this.model,
                tests: []
            }), this.el.querySelector("[data-hook='equation']"));

        this.renderSubview(
            new StoichSpecieCollectionFormView({
                collection: this.model.reactants
            }), this.el.querySelector("[data-hook='reactants']"));

        this.renderSubview(
            new StoichSpecieCollectionFormView({
                collection: this.model.products
            }), this.el.querySelector("[data-hook='products']"));
        
        return this;
    }
});
