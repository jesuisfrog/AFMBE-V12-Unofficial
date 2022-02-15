export class afmbeActorSheet extends ActorSheet {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["afmbe", "sheet", "actor"],
          template: "systems/afmbe/templates/character-sheet.html",
            width: 700,
            height: 780,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core"}],
            dragDrop: [{dragSelector: [
            ".item"
            ], 
            dropSelector: null}]
      });
    }
  
    /* -------------------------------------------- */
    /** @override */

  getData() {
    const  data = super.getData(); 
    data.dtypes = ["String", "Number", "Boolean"];
    data.isGM = game.user.isGM;
    data.editable = data.options.editable;
    const actorData = data.data;
    data.actor = actorData;
    data.data = actorData.data;
    let options = 0;
    let user = this.user;

    this._prepareCharacterItems(data)

    return data
  }

  _prepareCharacterItems(sheetData) {
      const actorData = sheetData.actor.data

      // Initialize Containers
      const item = [];
      const equippedItem = [];
      const weapon = [];
      const power = [];
      const quality = [];
      const skill = [];
      const drawback = [];

      // Iterate through items and assign to containers
      for (let i of sheetData.items) {
          switch (i.type) {
            case "item": 
                if (i.data.equipped) {equippedItem.push(i)}
                else {item.push(i)}
                break
            
            case "weapon": 
                weapon.push(i)
                break

            case "power": 
                power.push(i)
                break

            case "quality": 
                quality.push(i)
                break

            case "skill": 
                skill.push(i)
                break

            case "drawback": 
                drawback.push(i)
                break
          }
      }

      // Alphabetically sort all items
      const itemCats = [item, equippedItem, weapon, power, quality, skill, drawback]
      for (let category of itemCats) {
          if (category.length > 1) {
              category.sort((a,b) => {
                  let nameA = a.name.toLowerCase()
                  let nameB = b.name.toLowerCase()
                  if (nameA > nameB) {return 1}
                  else {return -1}
              })
          }
      }

      // Assign and return items
      actorData.item = item
      actorData.equippedItem = equippedItem
      actorData.weapon = weapon
      actorData.power = power
      actorData.quality = quality
      actorData.skill = skill
      actorData.drawback = drawback
  }

  /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // Run non-event functions
        this._createCharacterPointDivs()
        this._createStatusTags()

        // Buttons and Event Listeners
        html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
        html.find('.damage-roll').click(this._onDamageRoll.bind(this))
        html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
        html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
        html.find('.reset-resource').click(this._onResetResource.bind(this))
        
        // Update/Open Inventory Item
        html.find('.create-item').click(this._createItem.bind(this))

        html.find('.item-name').click( (ev) => {
            const li = ev.currentTarget.closest(".item")
            const item = this.actor.items.get(li.dataset.itemId)
            item.sheet.render(true)
            item.update({"data.value": item.data.data.value})
        })

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = ev.currentTarget.closest(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });
    }

    /**
   * Handle clickable rolls.
   * @param event   The originating click event
   * @private
   */

    _createItem(event) {
        event.preventDefault()
        const element = event.currentTarget
        
        let itemData = {
            name: `New ${element.dataset.create}`,
            type: element.dataset.create,
            cost: 0,
            level: 0
        }
        return Item.create(itemData, {parent: this.actor})
    }

    _createCharacterPointDivs() {
        let attributesDiv = document.createElement('div')
        let qualityDiv = document.createElement('div')
        let drawbackDiv = document.createElement('div')
        let skillDiv = document.createElement('div')
        let powerDiv = document.createElement('div')
        let characterTypePath = this.actor.data.data.characterTypes[this.actor.data.data.characterType]

        // Construct and assign div elements to the headers
        if(characterTypePath != undefined) {
            attributesDiv.innerHTML = `- [${this.actor.data.data.characterTypeValues[characterTypePath].attributePoints.value} / ${this.actor.data.data.characterTypeValues[characterTypePath].attributePoints.max}]`
            this.form.querySelector('#attributes-header').append(attributesDiv)

            qualityDiv.innerHTML = `- [${this.actor.data.data.characterTypeValues[characterTypePath].qualityPoints.value} / ${this.actor.data.data.characterTypeValues[characterTypePath].qualityPoints.max}]`
            this.form.querySelector('#quality-header').append(qualityDiv)

            drawbackDiv.innerHTML = `- [${this.actor.data.data.characterTypeValues[characterTypePath].drawbackPoints.value} / ${this.actor.data.data.characterTypeValues[characterTypePath].drawbackPoints.max}]`
            this.form.querySelector('#drawback-header').append(drawbackDiv)

            skillDiv.innerHTML = `- [${this.actor.data.data.characterTypeValues[characterTypePath].skillPoints.value} / ${this.actor.data.data.characterTypeValues[characterTypePath].skillPoints.max}]`
            this.form.querySelector('#skill-header').append(skillDiv)

            powerDiv.innerHTML = `- [${this.actor.data.data.characterTypeValues[characterTypePath].metaphysicsPoints.value} / ${this.actor.data.data.characterTypeValues[characterTypePath].metaphysicsPoints.max}]`
            this.form.querySelector('#power-header').append(powerDiv)
        }
    }

    _onAttributeRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let attributeLabel = element.dataset.attributeName

        // Create options for Qualities/Drawbacks/Skills
        let skillOptions = []
        for (let skill of this.actor.items.filter(item => item.type === 'skill')) {
            let option = `<option value="${skill.id}">${skill.name} ${skill.data.data.level}</option>`
            skillOptions.push(option)
        }

        let qualityOptions = []
        for (let quality of this.actor.items.filter(item => item.type === 'quality')) {
            let option = `<option value="${quality.id}">${quality.name} ${quality.data.data.cost}</option>`
            qualityOptions.push(option)
        }

        let drawbackOptions = []
        for (let drawback of this.actor.items.filter(item => item.type === 'drawback')) {
            let option = `<option value="${drawback.id}">${drawback.name} ${drawback.data.data.cost}</option>`
            drawbackOptions.push(option)
        }
        
        let d = new Dialog({
            title: 'Attribute Roll',
            content: `<div class="afmbe-dialog-menu">
                            <h2>${attributeLabel} Roll</h2>

                            <div class="afmbe-dialog-menu-text-box">
                                <div>
                                    <p>Apply modifiers from the character's applicable Qualities, Drawbacks, or Skills.</p>
                                    
                                    <ul>
                                        <li>Simple Test: 2x Attribute</li>
                                        <li>Difficult Test: 1x Attribute</li>
                                    </ul>
                                </div>
                            </div>


                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">Attribute Test</td>
                                        <td class="table-center-align">
                                            <select id="attributeTestSelect" name="attributeTest">
                                                <option value="Simple">Simple</option>
                                                <option value="Difficult">Difficult</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Roll Modifier</td>
                                        <td class="table-center-align"><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Skills</td>
                                        <td class="table-center-align">
                                            <select id="skillSelect" name="skills">
                                                <option value="None">None</option>
                                                ${skillOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Qualities</td>
                                        <td class="table-center-align">
                                            <select id="qualitySelect" name="qualities">
                                                <option value="None">None</option>
                                                ${qualityOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Drawbacks</td>
                                        <td class="table-center-align">
                                            <select id="drawbackSelect" name="drawbacks">
                                                <option value="None">None</option>
                                                ${drawbackOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                    </div>`,
            buttons: {
                one: {
                    label: 'Cancel',
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: 'Roll',
                    callback: html => {
                        // Grab the selected options
                        let attributeTestSelect = html[0].querySelector('#attributeTestSelect').value
                        let userInputModifier = Number(html[0].querySelector('#inputModifier').value)
                        let selectedSkill = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#skillSelect').value)
                        let selectedQuality = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#qualitySelect').value)
                        let selectedDrawback = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#drawbackSelect').value)

                        // Set values for options
                        let attributeValue = attributeTestSelect === 'Simple' ? this.actor.data.data[attributeLabel.toLowerCase()].value * 2 : this.actor.data.data[attributeLabel.toLowerCase()].value
                        let skillValue = selectedSkill != undefined ? selectedSkill.data.data.level : 0
                        let qualityValue = selectedQuality != undefined ? selectedQuality.data.data.cost : 0
                        let drawbackValue = selectedDrawback != undefined ? selectedDrawback.data.data.cost : 0

                        // Calculate total modifier to roll
                        let rollMod = (attributeValue + skillValue + qualityValue + userInputModifier) - drawbackValue

                        // Roll Dice
                        let roll = new Roll('1d10')
                        roll.roll({async: false})

                        // Calculate total result after modifiers
                        let totalResult = Number(roll.result) + rollMod

                        // Create Chat Message Content
                        let tags = [`<div>${attributeTestSelect} Test</div>`]
                        let ruleOfDiv = ``
                        if (userInputModifier != 0) {tags.push(`<div>User Modifier: ${userInputModifier}</div>`)}
                        if (selectedSkill != undefined) {tags.push(`<div>${selectedSkill.name}</div>`)}
                        if (selectedQuality != undefined) {tags.push(`<div>${selectedQuality.name}</div>`)}
                        if (selectedDrawback != undefined) {tags.push(`<div>${selectedDrawback.name}</div>`)}

                        if (roll.result == 10) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 10!</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-ten">Roll Again</button>`
                            totalResult = 10
                        }
                        if (roll.result == 1) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 1!</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-one">Roll Again</button>`
                            totalResult = 0
                        }

                        let chatContent = `<form>
                                                <h2>${attributeLabel} Roll [${this.actor.data.data[attributeLabel.toLowerCase()].value}]</h2>

                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Roll</th>
                                                            <th>Modifier</th>
                                                            <th>Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td data-roll="dice-result">[[${roll.result}]]</td>
                                                            <td data-roll="modifier">${rollMod}</td>
                                                            <td data-roll="dice-total">${totalResult}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                                                    ${ruleOfDiv}
                                                </div>
                                            </form>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<div class="afmbe-tags-flex-container">${tags.join('')}</div>`,
                            content: chatContent,
                            roll: roll
                          })
                        
                    }
                }
            },
            default: 'two',
            close: html => console.log()
        })

        d.render(true)
    }

    _onDamageRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let d = new Dialog({
            title: 'Weapon Roll',
            content: `<div class="afmbe-dialog-menu">

                            <div class="afmbe-dialog-menu-text-box">
                                <p><strong>If a ranged weapon</strong>, select how many shots to take and select weapon firing mode. The number of shots
                                fired will be reduced from the weapon's current load capacity. Make sure you have enough ammo in the chamber!</p>

                                <p>Otherwise, leave default and click roll.</p>
                            </div>

                            <div>
                                <h2>Options</h2>
                                <table>
                                    <tbody>
                                        <tr>
                                            <th># of Shots</th>
                                            <td>
                                                <input type="number" id="shotNumber" name="shotNumber" value="0">
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>Firing Mode</th>
                                            <td>
                                                <select id="firingMode" name="firingMode">
                                                    <option>None/Melee</option>
                                                    <option>Semi-Auto</option>
                                                    <option>Burst Fire</option>
                                                    <option>Auto-Fire</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                    <div>`,

            buttons: {
                one: {
                    label: 'Cancel',
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: 'Roll',
                    callback: html => {
                        // Grab Values from Dialog
                        let shotNumber = html[0].querySelector('#shotNumber').value
                        let firingMode = html[0].querySelector('#firingMode').value

                        let roll = new Roll(weapon.data.data.damage)
                        roll.roll({async: false})

                        let tags = [`<div>Damage Roll</div>`]
                        if (firingMode != 'None/Melee') {tags.push(`<div>${firingMode}: ${shotNumber}</div>`)}
                        if (weapon.data.data.damage_types[weapon.data.data.damage_type] != 'None') {tags.push(`<div>${weapon.data.data.damage_types[weapon.data.data.damage_type]}</div>`)}

                        // Reduce Fired shots from current load chamber
                        if (shotNumber > 0) {
                            switch (weapon.data.data.capacity.value - shotNumber >= 0) {
                                case true:
                                    weapon.update({'data.capacity.value': weapon.data.data.capacity.value - shotNumber})
                                    break

                                case false: 
                                    return ui.notifications.info(`You do not have enough ammo loaded to fire ${shotNumber} rounds!`)
                            }
                        }

                        // Create Chat Content
                        let chatContent = `<div>
                                                <h2>${weapon.name}</h2>

                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Damage</th>
                                                            <th>Detail</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>[[${roll.result}]]</td>
                                                            <td>${weapon.data.data.damage}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<div class="afmbe-tags-flex-container-item">${tags.join('')}</div>`,
                            content: chatContent,
                            roll: roll
                        })
                    }
                }
            },
            default: "two",
            close: html => console.log()
        })

        d.render(true)
    }

    _onArmorRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let roll = new Roll(equippedItem.data.data.armor_value)
        roll.roll({async: false})

        let tags = [`<div>Armor Roll</div>`]

        // Create Chat Content
        let chatContent = `<div>
                                <h2>${equippedItem.name}</h2>

                                <table class="afmbe-chat-roll-table">
                                    <thead>
                                        <tr>
                                            <th>Result</th>
                                            <th>Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>[[${roll.result}]]</td>
                                            <td>${equippedItem.data.data.armor_value}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`

        ChatMessage.create({
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            flavor: `<div class="afmbe-tags-flex-container-item">${tags.join('')}</div>`,
            content: chatContent,
            roll: roll
          })
    }

    _onToggleEquipped(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        switch (equippedItem.data.data.equipped) {
            case true:
                equippedItem.update({'data.equipped': false})
                break
            
            case false:
                equippedItem.update({'data.equipped': true})
                break
        }
    }

    _onResetResource(event) {
        event.preventDefault()
        let element = event.currentTarget
        let dataPath = `data.${element.dataset.resource}.value`

        this.actor.update({[dataPath]: this.actor.data.data[element.dataset.resource].max})
    }

    _createStatusTags() {
        let tagContainer = this.form.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')
        let enduranceTag = document.createElement('div')
        let essenceTag = document.createElement('div')
        let injuryTag = document.createElement('div')

        // Create Essence Tag and & Append
        if (this.actor.data.data.essence.value <= 1) {
            essenceTag.innerHTML = `<div>Hopless</div>`
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }
        else if (this.actor.data.data.essence.value <= (this.actor.data.data.essence.max / 2)) {
            essenceTag.innerHTML = `<div>Forlorn</div>`
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }

        // Create Endurance Tag and & Append
        if (this.actor.data.data.endurance_points.value <= 5) {
            enduranceTag.innerHTML = `<div>Exhausted</div>`
            enduranceTag.classList.add('tag')
            tagContainer.append(enduranceTag)
        }

        // Create Injury Tag and & Append
        if (this.actor.data.data.hp.value <= 5) {
            injuryTag.innerHTML = `<div>Severely Injured</div>`
            injuryTag.classList.add('tag')
            tagContainer.append(injuryTag)
        }

        // Create Encumbrance Tags & Append
        switch (this.actor.data.data.encumbrance.level) {
            case 1:
                encTag.innerHTML = `<div>Lightly Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 2:
                encTag.innerHTML = `<div>Moderately Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 3: 
                encTag.innerHTML = `<div>Heavily Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break
        }
    }

}