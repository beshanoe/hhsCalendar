(function(window){

    var Utils = {};

    Utils.dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    Utils.monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    Utils.textProperty = (typeof window.document.body.innerText != 'undefined' ? 'innerText': 'textContent'); //Checking whether we have firefox or other browser

    Utils.extend = function(object1){ //jQuery.extend( target [, object1 ] [, objectN ] ) function analogue
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++){
                var object2 = arguments[i];
                if (object2) {
                    for (key in object1) {
                        if (object2[key] !== undefined) {
                            object1[key] = object2[key];
                        }
                    }
                    for (key in object2) {
                        if (object1[key] === undefined) {
                            object1[key] = object2[key];
                        }
                    }
                }
            }
        }
        return object1;
    };

    Utils.forEach = function(ar, func) {
        var length = ar.length;
        for (var i = 0; i < length; i++){
            func(ar[i], i);
        }
    };

    Utils.isLocalStorageSupported = function(){ //Checking browser support of localStorage
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    Utils.createDomElement = window.document.createElement.bind(window.document);

    Utils.hasClass = function(el, className){
        return el.className.match(new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g'));
    };

    Utils.addClass = function(el){
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                if (!Utils.hasClass(el, arguments[i])) {
                    el.className += ' ' + arguments[i];
                }
            }
        }
    };

    Utils.removeClass = function(el){
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                el.className = el.className.replace(new RegExp('(?:^|\\s)' + arguments[i] + '(?!\\S)', 'g'), '');
            }
        }
    };

    Utils.addEvent = function(el, type, handler){
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent)  {
            el.attachEvent('on' + type, handler);
        }
    };

    Utils.renderTemplateWithObject = function(templateName, obj){ //Simplest template "engine" ever
        var templateEl = window.document.getElementById(templateName);
        if (templateEl) {
            var templateHtml = templateEl.innerHTML.trim();
            for (key in obj) {
                var regExp = new RegExp('{{' + key + '}}', 'g');
                templateHtml = templateHtml.replace(regExp, obj[key]);
            }
            templateHtml = templateHtml.replace(/{{([a-z0-9]*)}}/g, '');
            return templateHtml;
        }
        return '';
    };

    //Defining storage, use localStorage if it is available, otherwise use temporal plain object
    var storage = {};
    if (Utils.isLocalStorageSupported()) {
        storage = window.localStorage;
    }

    /*
     HeadHunterCalendar IMPLEMENTATION
     */

    var HeadHunterCalendar = function(options){
        if (this instanceof HeadHunterCalendar) {

            this.refreshToday = function(){
                var currentDate = new Date();
                this.today = {
                    date: currentDate.getDate(),
                    month: currentDate.getMonth(),
                    year: currentDate.getFullYear()
                };
            };
            this.refreshToday();

            options = Utils.extend({
                month: this.today.month,
                year: this.today.year,
                daysCount: 35
            }, options);

            if (options.monthYearIndicator) {
                var myi = options.monthYearIndicator;
                if (myi instanceof HTMLElement) {
                    this.monthYearIndicator = myi;
                }
            }
            this.storage = {};
            if (options.storage) {
                this.storage = options.storage;
            }

            this.date = new Date(options.year, options.month, 1);
            this.daysCount = options.daysCount;

            //Create table element
            var tdElements = [];
            var tableEl = Utils.createDomElement('table');
            tableEl.className = 'calendar';
            //Create tbody
            var tbodyEl = Utils.createDomElement('tbody');
            tableEl.appendChild(tbodyEl);
            //Fill with <tr>s and <td>s
            for (var d = 0, trEl; d < this.daysCount; d++) {
                if (!(d % 7)) {
                    trEl = Utils.createDomElement('tr');
                    tbodyEl.appendChild(trEl);
                }
                var tdEl = window.document.createElement('td');
                tdElements.push(tdEl);
                trEl.appendChild(tdEl);
            }

            this.tdElements = tdElements;
            this.tableEl = tableEl;

            this.render(this.storage);

        }
    };

    HeadHunterCalendar.prototype.render = function(data){

        if (!data) {
            data = this.storage;
        }

        if (this.monthYearIndicator) {
            this.monthYearIndicator.innerHTML = this.getMonthYearPorusski(Utils.monthNames);
        }

        var date = new Date(0, 0, 0);
        date.setDate(1);
        date.setMonth(this.date.getMonth());
        date.setFullYear(this.date.getFullYear());
        var day = date.getDay();
        day = ((day == 0) ? 6: day - 1);
        date.setDate(-day);
        var todayTime = new Date(this.today.year, this.today.month, this.today.date).getTime();

        for (var d = 0; d < this.tdElements.length; d++) {

            var tdElement = this.tdElements[d];

            date.setDate(date.getDate() + 1);
            tdElement.hhcDate = new Date(date.getTime());

            var dayInMonth = tdElement.hhcDate.getDate();
            if (d < 7) {
                dayInMonth = Utils.dayNames[d] + ', ' + dayInMonth;
            }

            var timestampString = '' + tdElement.hhcDate.getTime();
            var recordsRendered = '';
            if (data[timestampString]) {
                var records = JSON.parse(data[timestampString]);
                for (var i = 0; i < records.length; i++){
                    recordsRendered += Utils.renderTemplateWithObject('template-record', records[i]);
                }
            }

            tdElement.className = '';
            tdElement.innerHTML = Utils.renderTemplateWithObject('template-td', {
                day: dayInMonth,
                records: recordsRendered
            });
            if (recordsRendered != '') {
                Utils.addClass(tdElement, 'has-records');
            }

            if (tdElement.hhcDate.getTime() === todayTime) {
                Utils.addClass(tdElement, 'today');
            }
        }

    };

    HeadHunterCalendar.prototype.getTableElement = function(){
        return this.tableEl;
    };

    HeadHunterCalendar.prototype.setMonth = function(month){
        if (this.date.getMonth() != month) {
            this.date.setMonth(month);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getMonth = function(){
        return this.date.getMonth();
    };
    HeadHunterCalendar.prototype.setYear = function(year){
        if (this.date.getFullYear() != year) {
            this.date.setFullYear(year);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getYear = function(){
        return this.date.getFullYear();
    };
    HeadHunterCalendar.prototype.setToday = function(){
        this.date.setMonth(this.today.month);
        this.date.setFullYear(this.today.year);
        this.render();
    };

    HeadHunterCalendar.prototype.getMonthYearPorusski = function(names){
        return names[this.date.getMonth()] + ' ' + this.date.getFullYear();
    };

    HeadHunterCalendar.prototype.refresh = function(){
        this.refreshToday();
        this.render();
    };

    HeadHunterCalendar.prototype.addCellEvent = function(type, handler){
        for (var i = 0; i < this.tdElements.length; i++) {
            var el = this.tdElements[i];
            if (el) {
                Utils.addEvent(el, type, (function(hhCalendar, td){
                    return function(e){
                        handler(hhCalendar, td, e);
                    }
                })(this, el));
            }
        }
    };

    /*
     POPUP Implementation
     */

    var Popup = function(id, options){
        if (this instanceof Popup) {

            options = Utils.extend({
                anywhereClose: true,
                className: false,
                closeButton: true
            }, options);

            if (options.anywhereClose) {
                Utils.addEvent(window.document.body, 'click', (function(popup){
                    return function(e){
                        if (popup.isShown) {
                            popup.hide();
                        }
                    };
                })(this))
            }

            this.isShown = false;

            var div = Utils.createDomElement('div');
            this.getDiv = function(){
                return div;
            };
            if (options.className) {
                Utils.addClass(div, options.className);
            }
            Utils.addClass(div, 'popup');
            Utils.addEvent(div, 'click', function(e){
                e.stopPropagation();
            })

            if (options.closeButton) {
                var closeBtn = Utils.createDomElement('div');
                Utils.addClass(closeBtn, 'close-btn');
                closeBtn[Utils.textProperty] = 'x';
                Utils.addEvent(closeBtn, 'click', (function(that){
                    return function(e){
                        that.hide();
                    }
                })(this));
                div.appendChild(closeBtn);
            }

            var arrow = Utils.createDomElement('div');
            Utils.addClass(arrow, 'arrow');
            div.appendChild(arrow);

            var el = window.document.getElementById(id);
            if (el) {
                div.appendChild(el);
            }

            window.document.body.appendChild(div);

        }
    }

    Popup.prototype.show = function(options){
        options = Utils.extend({
            el: false,
            arrow: false
        }, options);

        if (options.arrow) {
            Utils.removeClass(this.getDiv(), 'top', 'right', 'bottom', 'left');
            Utils.addClass(this.getDiv(), options.arrow);
        }
        if (options.el) {

            var rect = options.el.getBoundingClientRect();
            var elPoint = {x: 0, y: 0};
            switch (options.arrow) {
                case 'top':
                    elPoint.x = rect.left;
                    elPoint.y = rect.top + rect.height + 16;
                    break;
                case 'bottom':
                    break;
                case 'left':
                    elPoint.x = rect.right + 16;
                    elPoint.y = rect.top;
                    break;
            }
            this.getDiv().style.left = elPoint.x + 'px';
            this.getDiv().style.top = elPoint.y + 'px';

        }

        this.isShown = true;
        if (!Utils.hasClass(this.getDiv(), 'show')){
            Utils.addClass(this.getDiv(), 'show');
        }
        if (this.onshow) {
            this.onshow(this);
        }
    };

    Popup.prototype.hide = function(){
        this.isShown = false;
        Utils.removeClass(this.getDiv(), 'show');
        if (this.onhide) {
            this.onhide(this);
        }
    };

    /*
     Editable divs
     */

    var Editable = function(el, options){
        if(this instanceof Editable){

            var content = el.querySelector('.content');
            var text = content.querySelector('.text');
            var input = el.querySelector('.field input');

            this.editMode = function(isEdit){
                if (isEdit) {
                    if (!Utils.hasClass(el, 'edit')) {
                        Utils.addClass(el, 'edit');
                    }
                } else {
                    Utils.removeClass(el, 'edit');
                }
            };

            (function(that){
                var value = '';
                that.setValue = function(t){
                    value = t;
                    text[Utils.textProperty] = value;
                    input.value = value;
                    if (t != '') {
                        that.editMode(false);
                    }
                    return that;
                };
                that.getValue = function(){
                    return value;
                };
            })(this);

            Utils.addEvent(content, 'click', (function(that){
                return function(e){
                    that.editMode(true);
                    input.focus();
                }
            })(this));

            var inputHandler = (function(that){
                return function(e){
                    that.setValue(e.target.value);
                }
            })(this);

            Utils.addEvent(input, 'keyup', function(e){
                if (e.keyCode == 13) {
                    inputHandler(e);
                }
            });

            Utils.addEvent(input, 'blur', function(e){
                inputHandler(e);
            });

        }
    };

    /*
     MAIN
     */

    //Creating almighty HeadHunterCalendar instance!
    var headHunterCalendar = new HeadHunterCalendar({
        storage: storage,
        monthYearIndicator: document.querySelector('#monthYearIndicator')
    });
    console.log(headHunterCalendar);

    var calendarDiv = window.document.getElementById('calendar-block');
    if (calendarDiv) {
        calendarDiv.innerHTML = '';
        calendarDiv.appendChild(headHunterCalendar.getTableElement());
    }

    //Creating popups
    //Edit cell popup
    var editPopup = new Popup('edit-popup');
    headHunterCalendar.addCellEvent('click', function(hhCalendar, td, e){
        e.stopPropagation();
        var prev = hhCalendar.getTableElement().querySelector('td.selected');
        if (prev) {
            Utils.removeClass(prev, 'selected');
        }
        Utils.addClass(td, 'selected');
        editPopup.timeStamp = td.hhcDate.getTime();
        editPopup.show({
            el: td,
            arrow: 'left'
        })
    });
    //Creating editables
    var titleEditable = new Editable(editPopup.getDiv().querySelector('.input-text.title'));
    var dateEditable = new Editable(editPopup.getDiv().querySelector('.input-text.date'));
    var membersEditable = new Editable(editPopup.getDiv().querySelector('.input-text.members'));
    var descriptionEl = editPopup.getDiv().querySelector('.description');

    editPopup.onshow = function(popup){
        if (popup.timeStamp) {
            var keyTs = '' + popup.timeStamp;
            if (storage[keyTs]) {
                var records = JSON.parse(storage[keyTs]);
                if (records[0]) {
                    titleEditable.setValue(records[0].title);
                    dateEditable.setValue('5 september');
                    membersEditable.setValue(records[0].members);
                    descriptionEl[Utils.textProperty] = records[0].description;
                }
            } else {
                titleEditable.setValue('').editMode(true);
                dateEditable.setValue('').editMode(true);
                membersEditable.setValue('').editMode(true);
                descriptionEl[Utils.textProperty] = '';
            }
        }
    };

    //Add record popup and add button
    var addPopup = new Popup('add-popup');
    var addBtn = window.document.getElementById('add-button');
    addPopup.onshow = function(){
        Utils.addClass(addBtn, 'pressed');
    }
    addPopup.onhide = function(){
        Utils.removeClass(addBtn, 'pressed');
    }
    Utils.addEvent(addBtn, 'click', function(e){
        e.stopPropagation();
        e.preventDefault();
        addPopup.show({
            el: e.target,
            arrow: 'top'
        });
    });
    //Refresh button click handling
    var refreshBtn = window.document.getElementById('refresh-button');
    Utils.addEvent(refreshBtn, 'click', function(e){
        e.preventDefault();
        headHunterCalendar.refresh();
    });

    //Search input and search popup
    var searchPopup = new Popup('search-popup', {
        closeButton: false
    });
    var searchInput = window.document.getElementById('search-input');
    Utils.addEvent(searchInput, 'click', function(e){
        e.stopPropagation();
        searchPopup.show({
            el: e.target,
            arrow: 'top'
        });
    });


    //Date picker buttons clicks handler
    var datePickerBtnHandler = function(e){
        e.preventDefault();
        var action = e.target.getAttribute('data-action');
        if (action) {
            switch (action) {
                case 'prev':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() - 1);
                    break;
                case 'next':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() + 1);
                    break;
                case 'today':
                    headHunterCalendar.setToday();
            }
        }
    };
    //Assigning handler to all buttons in date picker
    var datePickerBtns = window.document.querySelectorAll('.date-picker .btn');
    for (var i = 0; i < datePickerBtns.length; i++) {
        Utils.addEvent(datePickerBtns[i], 'click', datePickerBtnHandler);
    }

})(window);