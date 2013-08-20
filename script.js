(function (window) {

    "use strict";

    var Utils = {},
        storage = {},
        HeadHunterCalendar,
        Popup,
        Editable,
        headHunterCalendar;

    Utils.dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    Utils.monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    Utils.textProperty = (window.document.body.innerText !== undefined ? 'innerText' : 'textContent'); //Checking whether we have firefox or other browser

    Utils.forEach = function (array, handler, startFrom) {
        var i,
            length = array.length;
        if (startFrom === undefined) {
            startFrom = 0;
        }
        for (i = startFrom; i < length; i += 1) {
            handler(i, array[i]);
        }
    };

    Utils.extend = function (object1) { //jQuery.extend( target [, object1 ] [, objectN ] ) function analogue
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                var object2,
                    key;
                object2 = arguments[i];
                if (object2) {
                    for (key in object1) {
                        if (object1.hasOwnProperty(key)) {
                            if (object2[key] !== undefined) {
                                object1[key] = object2[key];
                            }
                        }
                    }
                    for (key in object2) {
                        if (object2.hasOwnProperty(key)) {
                            if (object1[key] === undefined) {
                                object1[key] = object2[key];
                            }
                        }
                    }
                }
            }, 1);
        }
        return object1;
    };

    Utils.isLocalStorageSupported = function () { //Checking browser support of localStorage
        try {
            return window.hasOwnProperty('localStorage') && window.localStorage !== null;
        } catch (e) {
            return false;
        }
    };

    Utils.createDomElement = window.document.createElement.bind(window.document);

    Utils.hasClass = function (el, className) {
        return el.className.match(new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g'));
    };

    Utils.addClass = function (el) {
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                if (!Utils.hasClass(el, value)) {
                    el.className += ' ' + value;
                }
            });
        }
    };

    Utils.removeClass = function (el) {
        if (arguments.length > 1) {
            Utils.forEach(arguments, function (i, value) {
                el.className = el.className.replace(new RegExp('(?:^|\\s)' + value + '(?!\\S)', 'g'), '');
            });
        }
    };

    Utils.addEvent = function (el, type, handler) {
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + type, handler);
        }
    };

    Utils.renderTemplateWithObject = function (templateName, obj) { //Simplest template "engine" ever
        var templateEl = window.document.getElementById(templateName),
            templateHtml,
            key,
            regExp;

        if (templateEl) {
            templateHtml = templateEl.innerHTML.trim();
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    regExp = new RegExp('{{' + key + '}}', 'g');
                    templateHtml = templateHtml.replace(regExp, obj[key]);
                }
            }
            templateHtml = templateHtml.replace(new RegExp('{{([a-z0-9]*)}}', 'g'), '');
            return templateHtml;
        }
        return '';
    };

    //Defining storage, use localStorage if it is available, otherwise use temporal plain object
    if (Utils.isLocalStorageSupported()) {
        storage = window.localStorage;
    }

    /*
     HeadHunterCalendar IMPLEMENTATION
     */

    HeadHunterCalendar = function (options) {
        if (this instanceof HeadHunterCalendar) {

            var tdElements,
                tableEl,
                tbodyEl,
                trEl,
                tdEl,
                monthYearIndicator,
                d;

            this.refreshToday = function () {
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
                monthYearIndicator = options.monthYearIndicator;
                if (monthYearIndicator instanceof HTMLElement) {
                    this.monthYearIndicator = monthYearIndicator;
                }
            }
            this.storage = {};
            if (options.storage) {
                this.storage = options.storage;
            }

            this.date = new Date(options.year, options.month, 1);
            this.daysCount = options.daysCount;

            //Create table element
            tdElements = [];
            tableEl = Utils.createDomElement('table');
            tableEl.className = 'calendar';
            //Create tbody
            tbodyEl = Utils.createDomElement('tbody');
            tableEl.appendChild(tbodyEl);
            //Fill with <tr>s and <td>s
            for (d = 0; d < this.daysCount; d += 1) {
                if (!(d % 7)) {
                    trEl = Utils.createDomElement('tr');
                    tbodyEl.appendChild(trEl);
                }
                tdEl = window.document.createElement('td');
                tdElements.push(tdEl);
                trEl.appendChild(tdEl);
            }

            this.tdElements = tdElements;
            this.tableEl = tableEl;

            this.render(this.storage);

        }
    };

    HeadHunterCalendar.prototype.render = function (data) {

        var date,
            day,
            todayTime;

        if (!data) {
            data = this.storage;
        }

        if (this.monthYearIndicator) {
            this.monthYearIndicator.innerHTML = this.getMonthYearPorusski(Utils.monthNames);
        }

        date = new Date(0, 0, 0);
        date.setDate(1);
        date.setMonth(this.date.getMonth());
        date.setFullYear(this.date.getFullYear());
        day = date.getDay();
        day = ((day === 0) ? 6 : day - 1);
        date.setDate(-day);
        todayTime = new Date(this.today.year, this.today.month, this.today.date).getTime();

        Utils.forEach(this.tdElements, function (d, tdElement) {
            var dayInMonth,
                timestampString,
                recordsRendered,
                records;

            date.setDate(date.getDate() + 1);
            tdElement.hhcDate = new Date(date.getTime());

            dayInMonth = tdElement.hhcDate.getDate();
            if (d < 7) {
                dayInMonth = Utils.dayNames[d] + ', ' + dayInMonth;
            }

            timestampString = tdElement.hhcDate.getTime();
            recordsRendered = '';
            if (data[timestampString]) {
                records = JSON.parse(data[timestampString]);
                Utils.forEach(records, function (i, value) {
                    recordsRendered += Utils.renderTemplateWithObject('template-record', value);
                });
            }

            tdElement.className = '';
            tdElement.innerHTML = Utils.renderTemplateWithObject('template-td', {
                day: dayInMonth,
                records: recordsRendered
            });
            if (recordsRendered !== '') {
                Utils.addClass(tdElement, 'has-records');
            }

            if (tdElement.hhcDate.getTime() === todayTime) {
                Utils.addClass(tdElement, 'today');
            }
        });

    };

    HeadHunterCalendar.prototype.getTableElement = function () {
        return this.tableEl;
    };

    HeadHunterCalendar.prototype.setMonth = function (month) {
        if (this.date.getMonth() !== month) {
            this.date.setMonth(month);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getMonth = function () {
        return this.date.getMonth();
    };
    HeadHunterCalendar.prototype.setYear = function (year) {
        if (this.date.getFullYear() !== year) {
            this.date.setFullYear(year);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getYear = function () {
        return this.date.getFullYear();
    };
    HeadHunterCalendar.prototype.setToday = function () {
        this.date.setMonth(this.today.month);
        this.date.setFullYear(this.today.year);
        this.render();
    };

    HeadHunterCalendar.prototype.getMonthYearPorusski = function (names) {
        return names[this.date.getMonth()] + ' ' + this.date.getFullYear();
    };

    HeadHunterCalendar.prototype.refresh = function () {
        this.refreshToday();
        this.render();
    };

    HeadHunterCalendar.prototype.addCellEvent = function (type, handler) {
        var i, el, func;
        func = function (hhCalendar, td) {
            return function (e) {
                handler(hhCalendar, td, e);
            };
        };
        for (i = 0; i < this.tdElements.length; i += 1) {
            el = this.tdElements[i];
            if (el) {
                Utils.addEvent(el, type, func(this, el));
            }
        }
    };

    /*
     POPUP Implementation
     */

    Popup = function (id, options) {
        if (this instanceof Popup) {

            var div,
                closeBtn,
                arrow,
                el;

            options = Utils.extend({
                anywhereClose: true,
                className: false,
                closeButton: true
            }, options);

            if (options.anywhereClose) {
                Utils.addEvent(window.document.body, 'click', (function (popup) {
                    return function (e) {
                        if (popup.isShown) {
                            popup.hide();
                        }
                    };
                }(this)));
            }

            this.isShown = false;

            div = Utils.createDomElement('div');
            this.getDiv = function () {
                return div;
            };
            if (options.className) {
                Utils.addClass(div, options.className);
            }
            Utils.addClass(div, 'popup');
            Utils.addEvent(div, 'click', function (e) {
                e.stopPropagation();
            });

            if (options.closeButton) {
                closeBtn = Utils.createDomElement('div');
                Utils.addClass(closeBtn, 'close-btn');
                closeBtn[Utils.textProperty] = 'x';
                Utils.addEvent(closeBtn, 'click', (function (that) {
                    return function (e) {
                        that.hide();
                    };
                }(this)));
                div.appendChild(closeBtn);
            }

            arrow = Utils.createDomElement('div');
            Utils.addClass(arrow, 'arrow');
            div.appendChild(arrow);

            el = window.document.getElementById(id);
            if (el) {
                div.appendChild(el);
            }

            window.document.body.appendChild(div);

        }
    };

    Popup.prototype.show = function (options) {
        options = Utils.extend({
            el: false,
            arrow: false
        }, options);

        if (options.arrow) {
            Utils.removeClass(this.getDiv(), 'top', 'right', 'bottom', 'left');
            Utils.addClass(this.getDiv(), options.arrow);
        }
        if (options.el) {

            var rect = options.el.getBoundingClientRect(),
                elPoint = {x: 0, y: 0};
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
        if (!Utils.hasClass(this.getDiv(), 'show')) {
            Utils.addClass(this.getDiv(), 'show');
        }
        if (this.onshow) {
            this.onshow(this);
        }
    };

    Popup.prototype.hide = function () {
        this.isShown = false;
        Utils.removeClass(this.getDiv(), 'show');
        if (this.onhide) {
            this.onhide(this);
        }
    };

    /*
     Editable divs
     */

    Editable = function (el, options) {
        if (this instanceof Editable) {

            var content = el.querySelector('.content'),
                text = content.querySelector('.text'),
                input = el.querySelector('.field input'),
                inputHandler;

            this.editMode = function (isEdit) {
                if (isEdit) {
                    if (!Utils.hasClass(el, 'edit')) {
                        Utils.addClass(el, 'edit');
                    }
                } else {
                    Utils.removeClass(el, 'edit');
                }
            };

            (function (that) {
                var value = '';
                that.setValue = function (t) {
                    value = t;
                    text[Utils.textProperty] = value;
                    input.value = value;
                    if (t !== '') {
                        that.editMode(false);
                    }
                    return that;
                };
                that.getValue = function () {
                    return value;
                };
            }(this));

            Utils.addEvent(content, 'click', (function (that) {
                return function (e) {
                    that.editMode(true);
                    input.focus();
                };
            }(this)));

            inputHandler = (function (that) {
                return function (e) {
                    that.setValue(e.target.value);
                };
            }(this));

            Utils.addEvent(input, 'keyup', function (e) {
                if (e.keyCode === 13) {
                    inputHandler(e);
                }
            });

            Utils.addEvent(input, 'blur', function (e) {
                inputHandler(e);
            });

        }
    };

    /*
     MAIN
     */
    (function () {

        var headHunterCalendar,
            calendarDiv,
            editPopup,
            titleEditable,
            dateEditable,
            membersEditable,
            descriptionEl,
            editDoneBtn,
            editDeleteBtn,
            addPopup,
            addBtn,
            refreshBtn,
            searchPopup,
            searchInput,
            datePickerBtnHandler,
            datePickerBtns;


        //Creating almighty HeadHunterCalendar instance!
        headHunterCalendar = new HeadHunterCalendar({
            storage: storage,
            monthYearIndicator: window.document.querySelector('#monthYearIndicator')
        });
        //console.log(headHunterCalendar);

        calendarDiv = window.document.getElementById('calendar-block');
        if (calendarDiv) {
            calendarDiv.innerHTML = '';
            calendarDiv.appendChild(headHunterCalendar.getTableElement());
        }

        //Creating popups
        //Edit cell popup
        editPopup = new Popup('edit-popup');
        headHunterCalendar.addCellEvent('click', function (hhCalendar, td, e) {
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
            });
        });
        //Creating editables
        titleEditable = new Editable(editPopup.getDiv().querySelector('.input-text.title'));
        dateEditable = new Editable(editPopup.getDiv().querySelector('.input-text.date'));
        membersEditable = new Editable(editPopup.getDiv().querySelector('.input-text.members'));
        descriptionEl = editPopup.getDiv().querySelector('.description');

        editDoneBtn = editPopup.getDiv().querySelector('.buttons .done');
        editDeleteBtn = editPopup.getDiv().querySelector('.buttons .delete');

        editPopup.onshow = function (popup) {
            if (popup.timeStamp) {
                var keyTs = popup.timeStamp.toString(),
                    records;
                if (storage[keyTs]) {
                    records = JSON.parse(storage[keyTs]);
                    if (records[0]) {
                        titleEditable.setValue(records[0].title);
                        dateEditable.setValue('5 september');
                        membersEditable.setValue(records[0].members);
                        descriptionEl.value = records[0].description;
                    }
                } else {
                    titleEditable.setValue('').editMode(true);
                    dateEditable.setValue('').editMode(true);
                    membersEditable.setValue('').editMode(true);
                    descriptionEl.value = '';
                }
            }
        };

        Utils.addEvent(editDoneBtn, 'click', function () {
            if (editPopup.timeStamp) {

            }
        });

        //Add record popup and add button
        addPopup = new Popup('add-popup');
        addBtn = window.document.getElementById('add-button');
        addPopup.onshow = function () {
            Utils.addClass(addBtn, 'pressed');
        };
        addPopup.onhide = function () {
            Utils.removeClass(addBtn, 'pressed');
        };
        Utils.addEvent(addBtn, 'click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            addPopup.show({
                el: e.target,
                arrow: 'top'
            });
        });
        //Refresh button click handling
        refreshBtn = window.document.getElementById('refresh-button');
        Utils.addEvent(refreshBtn, 'click', function (e) {
            e.preventDefault();
            headHunterCalendar.refresh();
        });

        //Search input and search popup
        searchPopup = new Popup('search-popup', {
            closeButton: false
        });
        searchInput = window.document.getElementById('search-input');
        Utils.addEvent(searchInput, 'click', function (e) {
            e.stopPropagation();
            searchPopup.show({
                el: e.target,
                arrow: 'top'
            });
        });

        //Date picker buttons clicks handler
        datePickerBtnHandler = function (e) {
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
                    break;
                }
            }
        };
        //Assigning handler to all buttons in date picker
        datePickerBtns = window.document.querySelectorAll('.date-picker .btn');
        Utils.forEach(datePickerBtns, function (i, value) {
            Utils.addEvent(value, 'click', datePickerBtnHandler);
        });

    }());

}(window));