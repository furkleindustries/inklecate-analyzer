import {
	Choice,
} from './Choice';
import {
	ChoicePoint,
} from './ChoicePoint';
import {
	Container,
} from './Container';
import {
	ControlCommand,
} from './ControlCommand';
import {
	DebugMetadata,
} from './DebugMetadata';
import {
	Divert,
} from './Divert';
import {
	InkList,
	InkListItem,
	KeyValuePair,
} from './InkList';
import {
	JObject,
} from './JObject';
import {
	JsonSerialisation,
} from './JsonSerialisation';
import {
	ListDefinition,
} from './ListDefinition';
import {
	ListDefinitionsOrigin,
} from './ListDefinitionsOrigin';
import {
	NativeFunctionCall,
} from './NativeFunctionCall';
import {
	throwNullException,
} from './NullException';
import {
	InkObject,
} from './Object';
import {
	Path,
} from './Path';
import {
	Pointer,
} from './Pointer';
import {
	PRNG,
} from './PRNG';
import {
	PushPopType,
} from './PushPop';
import {
	StringBuilder,
} from './StringBuilder';
import {
	Stopwatch,
} from './StopWatch';
import {
	StoryException,
} from './StoryException';
import {
	StoryState,
} from './StoryState';
import {
	Tag,
} from './Tag';
import {
	asOrNull,
	asOrThrows,
} from './TypeAssertion';
import {
	DivertTargetValue,
	IntValue,
	ListValue,
	StringValue,
	Value,
	VariablePointerValue,
} from './Value';
import {
	VariableAssignment,
} from './VariableAssignment';
import {
	VariableReference,
} from './VariableReference';
import {
	Void,
} from './Void';

export class Story extends InkObject {
	public readonly inkVersionCurrent = 19;
	public readonly inkVersionMinimumCompatible = 18;

	get currentChoices(): Choice[] {
		const choices: Choice[] = [];
		if (!this.state) {
			return throwNullException('this.state');
		}

		for (const choice of this.state.currentChoices) {
			if (!choice.isInvisibleDefault) {
				choice.index = choices.length;
				choices.push(choice);
			}
		}

		return choices;
	}

	get currentText() {
		this.IfAsyncWeCant('call currentText since it\'s a work in progress.');
		return this.state.currentText;
	}

	get currentTags() {
		this.IfAsyncWeCant('call currentTags since it\'s a work in progress.');
		return this.state.currentTags;
	}

	get currentErrors() {
		return this.state.currentErrors;
	}

	get currentWarnings() {
		return this.state.currentWarnings;
	}

	get hasError() {
		return this.state.hasError;
	}

	get hasWarning() {
		return this.state.hasWarning;
	}

	get variablesState() {
		return this.state.variablesState;
	}

	get listDefinitions() {
		return this._listDefinitions;
	}

	get state() {
		return this._state;
	}

	// TODO: Implement Profiler
	public readonly StartProfiling = () => { /* */ };
	public readonly EndProfiling = () => { /* */ };

	constructor(contentContainer: Container, lists: ListDefinition[] | null);
	constructor(jsonString: string);
	constructor(json: JObject);
	constructor() {
		super();

		// Discrimination between constructors
		let contentContainer: Container;
		let lists: ListDefinition[] | null = null;
		let json: JObject | null = null;

		if (arguments[0] instanceof Container) {
			contentContainer = arguments[0] as Container;

			if (arguments[1]) {
				lists = arguments[1];
			}

			// ------ Story (Container contentContainer, List<Runtime.ListDefinition> lists = null)
			this._mainContentContainer = contentContainer;
			// ------
		} else {
			json = arguments[0];
			if (typeof json === 'string') {
				json = JSON.parse(json);
			}
		}

		// ------ Story (Container contentContainer, List<Runtime.ListDefinition> lists = null)
		if (lists) {
			this._listDefinitions = new ListDefinitionsOrigin(lists);
		}

		this._externals = new Map();
		// ------

		// ------ Story(string jsonString) : this((Container)null)
		if (json) {
			const rootObject: JObject = json;
			const versionObj = rootObject.inkVersion;
			if (versionObj == null) {
				throw new Error("ink version number not found. Are you sure it's a valid .ink.json file?");
			}

			const formatFromFile = Number(versionObj);
			if (formatFromFile > this.inkVersionCurrent) {
				throw new Error('Version of ink used to build story was newer than the current version of the engine');
			} else if (formatFromFile < this.inkVersionMinimumCompatible) {
				throw new Error('Version of ink used to build story is too old to be loaded by this version of the engine');
			} else if (formatFromFile !== this.inkVersionCurrent) {
				console.warn("WARNING: Version of ink used to build story doesn't match current version of engine. Non-critical, but recommend synchronizing.");
			}

			const rootToken = rootObject.root;
			if (!rootToken) {
				throw new Error('Root node for ink not found. Are you sure it\'s a valid .ink.json file?');
			}

			if (rootObject.listDefs) {
				this._listDefinitions = JsonSerialisation.JTokenToListDefinitions(
					rootObject.listDefs,
				);
			}

			this._mainContentContainer = asOrThrows(
				JsonSerialisation.JTokenToRuntimeObject(rootToken),
				Container,
			);

			this.ResetState();
		}
		// ------
	}

	public readonly ToJsonString = () => {
		const rootContainerJsonList = JsonSerialisation.RuntimeObjectToJToken(
			this._mainContentContainer,
		);

		const rootObject: JObject = {};
		rootObject.inkVersion = this.inkVersionCurrent;
		rootObject.root = rootContainerJsonList;
		if (this.listDefinitions) {
			rootObject.listDefs = JsonSerialisation.ListDefinitionsToJToken(
				this.listDefinitions,
			);
		}

		return JSON.stringify(rootObject);
	};

	public readonly ResetState = () => {
		this.IfAsyncWeCant('ResetState');
		this._state = new StoryState(this);
		this._state.variablesState.ObserveVariableChange(
			this.VariableStateDidChangeEvent.bind(this),
		);

		this.ResetGlobals();
	};

	public readonly ResetErrors = () => {
		if (!this.state) {
			return throwNullException('this.state');
		}

		this.state.ResetErrors();

		return null;
	};

	public readonly ResetCallstack = () => {
		this.IfAsyncWeCant('ResetCallstack');
		if (!this.state) {
			return throwNullException('this.state');
		}

		this.state.ForceEnd();

		return null;
	};

	public readonly ResetGlobals = () => {
		if (this.mainContentContainer.namedContent.get('global decl')) {
			const originalPointer = this.state.currentPointer.copy();
			this.ChoosePath(new Path('global decl'), false);
			this.ContinueInternal();
			this.state.currentPointer = originalPointer;
		}

		this.state.variablesState.SnapshotDefaultGlobals();
	};

	public readonly Continue = () => {
		this.ContinueAsync(0);
		return this.currentText;
	};

	get canContinue() {
		return this.state.canContinue;
	}

	get asyncContinueComplete() {
		return !this._asyncContinueActive;
	}

	public readonly ContinueAsync = (millisecsLimitAsync: number) => {
		if (!this._hasValidatedExternals) {
			this.ValidateExternalBindings();
		}

		this.ContinueInternal(millisecsLimitAsync);
	};

	public ContinueInternal = (millisecsLimitAsync = 0) => {
		if (this._profiler) {
			this._profiler.PreContinue();
		}

		const isAsyncTimeLimited = millisecsLimitAsync > 0;
		this._recursiveContinueCount += 1;

		if (!this._asyncContinueActive) {
			this._asyncContinueActive = isAsyncTimeLimited;
			if (!this.canContinue) {
				throw new StoryException('Can\'t continue - should check canContinue before calling Continue');
			}

			this.state.didSafeExit = false;
			this.state.ResetOutput();
			if (this._recursiveContinueCount === 1) {
				this._state.variablesState.batchObservingVariableChanges = true;
			}
		};

		const durationStopwatch = new Stopwatch();
		durationStopwatch.Start();

		let outputStreamEndsInNewline = false;
		do {
			try {
				outputStreamEndsInNewline = this.ContinueSingleStep();
			} catch (err) {
				if (!(err instanceof StoryException)) {
					throw err;
				}

				this.AddError(err.message, undefined, err.useEndLineNumber);
				break;
			}

			if (outputStreamEndsInNewline) {
				break;
			}

			if (this._asyncContinueActive &&
				durationStopwatch.ElapsedMilliseconds > millisecsLimitAsync)
			{
				break;
			}

		} while (this.canContinue);

		durationStopwatch.Stop();
		if (outputStreamEndsInNewline || !this.canContinue) {
			if (this._stateAtLastNewline) {
				this.RestoreStateSnapshot(this._stateAtLastNewline);
				this._stateAtLastNewline = null;
			}

			if (!this.canContinue) {
				if (this.state.callStack.canPopThread) {
					this.AddError('Thread available to pop, threads should always be flat by the end of evaluation?');
				}

				if (this.state.generatedChoices.length === 0 &&
					!this.state.didSafeExit &&
					this._temporaryEvaluationContainer === null)
				{
					if (this.state.callStack.CanPop(PushPopType.Tunnel)) {
						this.AddError('unexpectedly reached end of content. Do you need a \'->->\' to return from a tunnel?');
					} else if (this.state.callStack.CanPop(PushPopType.Function)) {
						this.AddError('unexpectedly reached end of content. Do you need a \'~ return\'?');
					} else if (!this.state.callStack.canPop) {
						this.AddError('ran out of content. Do you need a \'-> DONE\' or \'-> END\'?"');
					} else {
						this.AddError('unexpectedly reached end of content for unknown reason. This is a compiler error.');
					}
				}
			}

			this.state.didSafeExit = false;
			if (this._recursiveContinueCount === 1) {
				this.state.variablesState.batchObservingVariableChanges = false;
			}

			this._asyncContinueActive = false;
		}

		this._recursiveContinueCount -= 1;
		if (this._profiler) {
			this._profiler.PostContinue();
		}
	}

	public ContinueSingleStep = () => {
		if (this._profiler) {
			this._profiler.PreStep();
		}

		this.Step();
		if (this._profiler) {
			this._profiler.PostStep();
		}

		if (!this.canContinue && !this.state.callStack.elementIsEvaluateFromGame) {
			this.TryFollowDefaultInvisibleChoice();
		}

		if (this._profiler) {
			this._profiler.PreSnapshot();
		}

		if (!this.state.inStringEvaluation) {
			if (this._stateAtLastNewline) {
				if (!this._stateAtLastNewline.currentTags) {
					return throwNullException('this._stateAtLastNewline.currentTags');
				} else if (!this.state.currentTags) {
					return throwNullException('this.state.currentTags');
				}

				const change = this.CalculateNewlineOutputStateChange(
					this._stateAtLastNewline.currentText,
					this.state.currentText,
					this._stateAtLastNewline.currentTags.length,
					this.state.currentTags.length,
				);

				if (change === Story.OutputStateChange.ExtendedBeyondNewline) {
					this.RestoreStateSnapshot(this._stateAtLastNewline);
					return true;
				} else if (change === Story.OutputStateChange.NewlineRemoved) {
					this._stateAtLastNewline = null;
				}
			}

			if (this.state.outputStreamEndsInNewline) {
				if (this.canContinue && !this._stateAtLastNewline) {
					this._stateAtLastNewline = this.StateSnapshot();
				} else {
					this._stateAtLastNewline = null;
				}
			}
		}

		if (this._profiler) {
			this._profiler.PostSnapshot();
		}

		return false;
	}

	public CalculateNewlineOutputStateChange = (
		prevText: string | null,
		currText: string | null,
		prevTagCount: number,
		currTagCount: number,
	) => {
		if (prevText === null) {
			return throwNullException('prevText');
		} else if (currText === null) {
			return throwNullException('currText');
		}

		const newlineStillExists = 
			currText.length >= prevText.length &&
				currText.charAt(prevText.length - 1) === '\n';

		if (prevTagCount === currTagCount &&
			prevText.length === currText.length &&
			newlineStillExists)
		{
			return Story.OutputStateChange.NoChange;
		} else if (!newlineStillExists) {
			return Story.OutputStateChange.NewlineRemoved;
		} else if (currTagCount > prevTagCount) {
			return Story.OutputStateChange.ExtendedBeyondNewline;
		}

		for (let ii = prevText.length; ii < currText.length; ii++) {
			const char = currText.charAt(ii);
			if (!/[ \t]/.test(char)) {
				return Story.OutputStateChange.ExtendedBeyondNewline;
			}
		}

		return Story.OutputStateChange.NoChange;
	}

	public ContinueMaximally = () => {
		this.IfAsyncWeCant('ContinueMaximally');
		const sb = new StringBuilder();
		while (this.canContinue) {
			sb.Append(this.Continue());
		}

		return sb.toString();
	}

	public ContentAtPath(path: Path) {
		return this.mainContentContainer.ContentAtPath(path);
	}

	public KnotContainerWithName(name: string) {
		let namedContainer = this.mainContentContainer.namedContent.get(name);
		if (namedContainer instanceof Container) {
			return namedContainer;
		}

		return null;
	};

	public PointerAtPath = (path: Path) => {
		if (!path.length) {
			return Pointer.Null;
		}

		const pointer = new Pointer();
		let pathLengthToUse = path.length;
		let result = null;
		if (!path.lastComponent) {
			return throwNullException('path.lastComponent');
		}

		if (path.lastComponent.isIndex) {
			pathLengthToUse = path.length - 1;
			result = this.mainContentContainer.ContentAtPath(path, undefined, pathLengthToUse);
			pointer.container = result.container;
			pointer.index = path.lastComponent.index;
		} else {
			result = this.mainContentContainer.ContentAtPath(path);
			pointer.container = result.container;
			pointer.index = -1;
		}

		if (result.obj == null || result.obj == this.mainContentContainer && pathLengthToUse > 0) {
			this.Error("Failed to find content at path '" + path + "', and no approximation of it was possible.");
		} else if (result.approximate) {
			this.Warning("Failed to find content at path '" + path + "', so it was approximated to: '"+result.obj.path+"'.");
		}

		return pointer;
	};

	public StateSnapshot = () => this.state.Copy();

	public RestoreStateSnapshot = (state: StoryState) => void (
		this._state = state
	);

	public Step = () => {
		let shouldAddToStream = true;
		let pointer = this.state.currentPointer.copy();
		if (pointer.isNull) {
			return;
		}

		// Container containerToEnter = pointer.Resolve () as Container;
		let containerToEnter = asOrNull(pointer.Resolve(), Container);
		while (containerToEnter) {
			this.VisitContainer(containerToEnter, true);

			// No content? the most we can do is step past it
			if (!containerToEnter.content.length) {
				break;
			}

			pointer = Pointer.StartOf(containerToEnter);
			// containerToEnter = pointer.Resolve() as Container;
			containerToEnter = asOrNull(pointer.Resolve(), Container);
		}

		this.state.currentPointer = pointer.copy();

		if (this._profiler) {
			this._profiler.Step(this.state.callStack);
		}

		// Is the current content object:
		//  - Normal content
		//  - Or a logic/flow statement - if so, do it
		// Stop flow if we hit a stack pop when we're unable to pop (e.g. return/done statement in knot
		// that was diverted to rather than called as a function)
		let currentContentObj = pointer.Resolve();
		const isLogicOrFlowControl = this.PerformLogicAndFlowControl(currentContentObj);

		// Has flow been forced to end by flow control above?
		if (this.state.currentPointer.isNull) {
			return;
		}

		if (isLogicOrFlowControl) {
			shouldAddToStream = false;
		}

		// Choice with condition?
		// var choicePoint = currentContentObj as ChoicePoint;
		let choicePoint = asOrNull(currentContentObj, ChoicePoint);
		if (choicePoint) {
			let choice = this.ProcessChoice(choicePoint);
			if (choice) {
				this.state.generatedChoices.push(choice);
			}

			currentContentObj = null;
			shouldAddToStream = false;
		}

		// If the container has no content, then it will be
		// the "content" itself, but we skip over it.
		if (currentContentObj instanceof Container) {
			shouldAddToStream = false;
		}

		// Content to add to evaluation stack or the output stream
		if (shouldAddToStream) {
			// If we're pushing a variable pointer onto the evaluation stack, ensure that it's specific
			// to our current (possibly temporary) context index. And make a copy of the pointer
			// so that we're not editing the original runtime object.
			// var varPointer = currentContentObj as VariablePointerValue;
			let varPointer = asOrNull(currentContentObj, VariablePointerValue);
			if (varPointer && varPointer.contextIndex === -1) {
				// Create new object so we're not overwriting the story's own data
				let contextIdx = this.state.callStack.ContextForVariableNamed(
					varPointer.variableName,
				);

				currentContentObj = new VariablePointerValue(
					varPointer.variableName,
					contextIdx,
				);
			}

			// Expression evaluation content
			if (this.state.inExpressionEvaluation) {
				this.state.PushEvaluationStack(currentContentObj);
			} else {
				// Output stream content (i.e. not expression evaluation)
				this.state.PushToOutputStream(currentContentObj);
			}
		}

		// Increment the content pointer, following diverts if necessary
		this.NextContent();

		// Starting a thread should be done after the increment to the content pointer,
		// so that when returning from the thread, it returns to the content after this instruction.
		// var controlCmd = currentContentObj as ;
		let controlCmd = asOrNull(currentContentObj, ControlCommand);
		if (controlCmd &&
			controlCmd.commandType === ControlCommand.CommandType.StartThread)
		{
			this.state.callStack.PushThread();
		}
	};

	public VisitContainer = (container: Container, atStart: boolean) => {
		if (!container.countingAtStartOnly || atStart) {
			if (container.visitsShouldBeCounted) {
				this.IncrementVisitCountForContainer(container);
			}

			if (container.turnIndexShouldBeCounted) {
				this.RecordTurnIndexVisitToContainer(container);
			}
		}
	};

	private _prevContainers: Container[] = [];
	public VisitChangedContainersDueToDivert = () => {
		const previousPointer = this.state.previousPointer.copy();
		const pointer = this.state.currentPointer.copy();

		if (pointer.isNull || pointer.index === -1) {
			return;
		}

		this._prevContainers.length = 0;
		if (!previousPointer.isNull) {
			// Container prevAncestor = previousPointer.Resolve() as Container ?? previousPointer.container as Container;
			let resolvedPreviousAncestor = previousPointer.Resolve();
			let prevAncestor = asOrNull(resolvedPreviousAncestor, Container) || asOrNull(previousPointer.container, Container);
			while (prevAncestor) {
				this._prevContainers.push(prevAncestor);
				// prevAncestor = prevAncestor.parent as Container;
				prevAncestor = asOrNull(prevAncestor.parent, Container);
			}
		}

		let currentChildOfContainer = pointer.Resolve();
		if (!currentChildOfContainer) {
			return;
		}

		// Container currentContainerAncestor = currentChildOfContainer.parent as Container;
		let currentContainerAncestor = asOrNull(
			currentChildOfContainer.parent,
			Container,
		);

		while (currentContainerAncestor &&
			(this._prevContainers.indexOf(currentContainerAncestor) < 0 ||
				currentContainerAncestor.countingAtStartOnly))
		{

			// Check whether this ancestor container is being entered at the start,
			// by checking whether the child object is the first.
			const enteringAtStart = currentContainerAncestor.content.length > 0 &&
				currentChildOfContainer == currentContainerAncestor.content[0];

			// Mark a visit to this container
			this.VisitContainer(currentContainerAncestor, enteringAtStart);

			currentChildOfContainer = currentContainerAncestor;
			// currentContainerAncestor = currentContainerAncestor.parent as Container;
			currentContainerAncestor = asOrNull(
				currentContainerAncestor.parent,
				Container,
			);
		}
	}

	public ProcessChoice = (choicePoint: ChoicePoint) => {
		let showChoice = true;

		// Don't create choice if choice point doesn't pass conditional
		if (choicePoint.hasCondition) {
			let conditionValue = this.state.PopEvaluationStack();
			if (!this.IsTruthy(conditionValue)) {
				showChoice = false;
			}
		}

		let startText = '';
		let choiceOnlyText = '';
		if (choicePoint.hasChoiceOnlyContent) {
			// var choiceOnlyStrVal = state.PopEvaluationStack () as StringValue;
			let choiceOnlyStrVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
			choiceOnlyText = choiceOnlyStrVal.value || '';
		}

		if (choicePoint.hasStartContent) {
			// var startStrVal = state.PopEvaluationStack () as StringValue;
			let startStrVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
			startText = startStrVal.value || '';
		}

		// Don't create choice if player has already read this content
		if (choicePoint.onceOnly) {
			let visitCount = this.VisitCountForContainer(choicePoint.choiceTarget);
			if (visitCount > 0) {
				showChoice = false;
			}
		}

		// We go through the full process of creating the choice above so
		// that we consume the content for it, since otherwise it'll
		// be shown on the output stream.
		if (!showChoice) {
			return null;
		}

		const choice = new Choice();
		choice.targetPath = choicePoint.pathOnChoice;
		choice.sourcePath = choicePoint.path.toString();
		choice.isInvisibleDefault = choicePoint.isInvisibleDefault;
		choice.threadAtGeneration = this.state.callStack.ForkThread();
		choice.text = (startText + choiceOnlyText).replace(/^[ \t]+|[ \t]+$/g, '');

		return choice;
	};

	public IsTruthy = (obj: InkObject) => {
		let truthy = false;
		if (obj instanceof Value) {
			let val = obj;
			if (val instanceof DivertTargetValue) {
				let divTarget = val;
				this.Error("Shouldn't use a divert target (to " + divTarget.targetPath + ") as a conditional value. Did you intend a function call 'likeThis()' or a read count check 'likeThis'? (no arrows)");
				return false;
			}

			return val.isTruthy;
		}

		return truthy;
	};

	public PerformLogicAndFlowControl = (contentObj: InkObject | null) => {
		if(!contentObj) {
			return false;
		} else if (contentObj instanceof Divert) {
			let currentDivert = contentObj;

			if (currentDivert.isConditional) {
				let conditionValue = this.state.PopEvaluationStack();

				// False conditional? Cancel divert
				if (!this.IsTruthy(conditionValue)) {
					return true;
				}
			}

			if (currentDivert.hasVariableTarget) {
				let varName = currentDivert.variableDivertName;

				let varContents = this.state.variablesState.GetVariableWithName(varName);

				if (varContents == null) {
					this.Error('Tried to divert using a target from a variable that could not be found (' + varName + ')');
				}
				else if (!(varContents instanceof DivertTargetValue)) {

					// var intContent = varContents as IntValue;
					let intContent = asOrNull(varContents, IntValue);

					let errorMessage = 'Tried to divert to a target from a variable, but the variable (' + varName + ") didn't contain a divert target, it ";
					if (intContent instanceof IntValue && intContent.value == 0) {
						errorMessage += 'was empty/null (the value 0).';
					} else {
						errorMessage += "contained '" + varContents + "'.";
					}

					this.Error(errorMessage);
				}

				let target = asOrThrows(varContents, DivertTargetValue);
				this.state.divertedPointer = this.PointerAtPath(target.targetPath);
			} else if (currentDivert.isExternal) {
				this.CallExternalFunction(currentDivert.targetPathString, currentDivert.externalArgs);
				return true;
			} else {
				this.state.divertedPointer = currentDivert.targetPointer.copy();
			}

			if (currentDivert.pushesToStack) {
				this.state.callStack.Push(
					currentDivert.stackPushType,
					undefined,
					this.state.outputStream.length,
				);
			}

			if (this.state.divertedPointer.isNull && !currentDivert.isExternal) {
				if (currentDivert && currentDivert.debugMetadata && currentDivert.debugMetadata.sourceName != null) {
					this.Error("Divert target doesn't exist: " + currentDivert.debugMetadata.sourceName);
				} else {
					this.Error('Divert resolution failed: ' + currentDivert);
				}
			}

			return true;
		} else if (contentObj instanceof ControlCommand) {
			// Start/end an expression evaluation? Or print out the result?
			const evalCommand = contentObj;
			switch (evalCommand.commandType) {
				case ControlCommand.CommandType.EvalStart:
					this.Assert(this.state.inExpressionEvaluation === false, 'Already in expression evaluation?');
					this.state.inExpressionEvaluation = true;
					break;

				case ControlCommand.CommandType.EvalEnd:
					this.Assert(this.state.inExpressionEvaluation === true, 'Not in expression evaluation mode');
					this.state.inExpressionEvaluation = false;
					break;

				case ControlCommand.CommandType.EvalOutput:
					// If the expression turned out to be empty, there may not be anything on the stack
					if (this.state.evaluationStack.length) {
						let output = this.state.PopEvaluationStack();

						// Functions may evaluate to Void, in which case we skip output
						if (!(output instanceof Void)) {
							// TODO: Should we really always blanket convert to string?
							// It would be okay to have numbers in the output stream the
							// only problem is when exporting text for viewing, it skips over numbers etc.
							let text = new StringValue(output.toString());

							this.state.PushToOutputStream(text);
						}
					}

					break;

				case ControlCommand.CommandType.NoOp:
					break;

				case ControlCommand.CommandType.Duplicate:
					this.state.PushEvaluationStack(this.state.PeekEvaluationStack());
					break;

				case ControlCommand.CommandType.PopEvaluatedValue:
					this.state.PopEvaluationStack();
					break;

				case ControlCommand.CommandType.PopFunction:
				case ControlCommand.CommandType.PopTunnel:

					const popType =
						evalCommand.commandType === ControlCommand.CommandType.PopFunction ?
							PushPopType.Function :
							PushPopType.Tunnel;

					let overrideTunnelReturnTarget: DivertTargetValue | null = null;
					if (popType === PushPopType.Tunnel) {
						const popped = this.state.PopEvaluationStack();
						// overrideTunnelReturnTarget = popped as DivertTargetValue;
						overrideTunnelReturnTarget = asOrNull(popped, DivertTargetValue);
						if (overrideTunnelReturnTarget === null) {
							this.Assert(popped instanceof Void, "Expected void if ->-> doesn't override target");
						}
					}

					if (this.state.TryExitFunctionEvaluationFromGame()) {
						break;
					} else if (this.state.callStack.currentElement.type != popType || !this.state.callStack.canPop) {
						const names: Map<PushPopType, string> = new Map();
						names.set(PushPopType.Function, 'function return statement (~ return)');
						names.set(PushPopType.Tunnel, 'tunnel onwards statement (->->)');
						let expected = names.get(this.state.callStack.currentElement.type);
						if (!this.state.callStack.canPop) {
							expected = 'end of flow (-> END or choice)';
						}

						const errorMsg = 'Found ' + names.get(popType) + ', when expected ' + expected;
						this.Error(errorMsg);
					} else {
						this.state.PopCallStack();
						if (overrideTunnelReturnTarget) {
							this.state.divertedPointer = this.PointerAtPath(
								overrideTunnelReturnTarget.targetPath,
							);
						}
					}

					break;

				case ControlCommand.CommandType.BeginString:
					this.state.PushToOutputStream(evalCommand);
					this.Assert(this.state.inExpressionEvaluation === true, 'Expected to be in an expression when evaluating a string');
					this.state.inExpressionEvaluation = false;
					break;

				case ControlCommand.CommandType.EndString:
					let contentStackForString: InkObject[] = [];
					let outputCountConsumed = 0;
					for (let ii = this.state.outputStream.length - 1; ii >= 0; --ii) {
						const obj = this.state.outputStream[ii];
						outputCountConsumed += 1;

						// var command = obj as ControlCommand;
						const command = asOrNull(obj, ControlCommand);
						if (command && command.commandType == ControlCommand.CommandType.BeginString) {
							break;
						} else if (obj instanceof StringValue ) {
							contentStackForString.push(obj);
						}
					}

					// Consume the content that was produced for this string
					this.state.PopFromOutputStream(outputCountConsumed);

					// The C# version uses a Stack for contentStackForString, but we're
					// using a simple array, so we need to reverse it before using it
					contentStackForString = contentStackForString.reverse();

					// Build string out of the content we collected
					const sb = new StringBuilder();
					for (const item of contentStackForString) {
						sb.Append(item.toString());
					}

					// Return to expression evaluation (from content mode)
					this.state.inExpressionEvaluation = true;
					this.state.PushEvaluationStack(new StringValue(sb.toString()));
					break;

				case ControlCommand.CommandType.ChoiceCount:
					let choiceCount = this.state.generatedChoices.length;
					this.state.PushEvaluationStack(new IntValue(choiceCount));
					break;

				case ControlCommand.CommandType.Turns:
					this.state.PushEvaluationStack(
						new IntValue(this.state.currentTurnIndex + 1),
					);

					break;

				case ControlCommand.CommandType.TurnsSince:
				case ControlCommand.CommandType.ReadCount:
					const target = this.state.PopEvaluationStack();
					if(!(target instanceof DivertTargetValue)) {
						let extraNote = '';
						if (target instanceof IntValue) {
							extraNote = ". Did you accidentally pass a read count ('knot_name') instead of a target ('-> knot_name')?";
						}

						this.Error('TURNS_SINCE / READ_COUNT expected a divert target (knot, stitch, label name), but saw ' + target + extraNote);
						break;
					}

					// var divertTarget = target as DivertTargetValue;
					let divertTarget = asOrThrows(target, DivertTargetValue);
					// var container = ContentAtPath (divertTarget.targetPath).correctObj as Container;
					let container = asOrNull(this.ContentAtPath(divertTarget.targetPath).correctObj, Container);

					let eitherCount;
					if (container) {
						if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince) {
							eitherCount = this.TurnsSinceForContainer(container);
						} else {
							eitherCount = this.VisitCountForContainer(container);
						}
					} else {
						if (evalCommand.commandType == ControlCommand.CommandType.TurnsSince) {
							eitherCount = -1;
						} else {
							eitherCount = 0;
						}

						this.Warning('Failed to find container for ' + evalCommand.toString() + ' lookup at ' + divertTarget.targetPath.toString());
					}

					this.state.PushEvaluationStack(new IntValue(eitherCount));
					break;

				case ControlCommand.CommandType.Random: {
					let maxInt = asOrNull(this.state.PopEvaluationStack(), IntValue);
					let minInt = asOrNull(this.state.PopEvaluationStack(), IntValue);
					if (!minInt || !(minInt instanceof IntValue)) {
						return this.Error('Invalid value for minimum parameter of RANDOM(min, max)');
					} else if (!maxInt || !(minInt instanceof IntValue)) {
						return this.Error('Invalid value for maximum parameter of RANDOM(min, max)');
					} else if (maxInt.value === null) {
						// Originally a primitive type, but here, can be null.
						// TODO: Replace by default value?
						return throwNullException('maxInt.value');
					} else if (minInt.value === null) {
						return throwNullException('minInt.value');
					}

					const randomRange = maxInt.value - minInt.value + 1;
					if (randomRange <= 0) {
						this.Error('RANDOM was called with minimum as ' + minInt.value + ' and maximum as ' + maxInt.value + '. The maximum must be larger');
					}

					const resultSeed = this.state.storySeed + this.state.previousRandom;
					const random = new PRNG(resultSeed);
					const nextRandom = random.next();
					const chosenValue = (nextRandom % randomRange) + minInt.value;
					this.state.PushEvaluationStack(new IntValue(chosenValue));

					// Next random number (rather than keeping the Random object around)
					this.state.previousRandom = nextRandom;
					break;
				}

				case ControlCommand.CommandType.SeedRandom:
					const seed = asOrNull(this.state.PopEvaluationStack(), IntValue);
					if (!seed || !(seed instanceof IntValue)) {
						return this.Error('Invalid value passed to SEED_RANDOM');
					} else if (seed.value === null) {
						// Originally a primitive type, but here, can be null.
						// TODO: Replace by default value?
						return throwNullException('minInt.value');
					}

					this.state.storySeed = seed.value;
					this.state.previousRandom = 0;

					this.state.PushEvaluationStack(new Void());
					break;

				case ControlCommand.CommandType.VisitIndex:
					const count = this.VisitCountForContainer(this.state.currentPointer.container) - 1; // index not count
					this.state.PushEvaluationStack(new IntValue(count));
					break;

				case ControlCommand.CommandType.SequenceShuffleIndex:
					const shuffleIndex = this.NextSequenceShuffleIndex();
					this.state.PushEvaluationStack(new IntValue(shuffleIndex));
					break;

				case ControlCommand.CommandType.StartThread:
					// Handled in main step function
					break;

				case ControlCommand.CommandType.Done:
					// We may exist in the context of the initial
					// act of creating the thread, or in the context of
					// evaluating the content.
					if (this.state.callStack.canPopThread) {
						this.state.callStack.PopThread();
					}

					// In normal flow - allow safe exit without warning
					else {
						this.state.didSafeExit = true;
						// Stop flow in current thread
						this.state.currentPointer = Pointer.Null;
					}

					break;

				// Force flow to end completely
				case ControlCommand.CommandType.End:
					this.state.ForceEnd();
					break;

				case ControlCommand.CommandType.ListFromInt:
					// var intVal = state.PopEvaluationStack () as IntValue;
					const intVal = asOrNull(this.state.PopEvaluationStack(), IntValue);
					// var listNameVal = state.PopEvaluationStack () as StringValue;
					const listNameVal = asOrThrows(this.state.PopEvaluationStack(), StringValue);
					if (intVal === null) {
						throw new StoryException('Passed non-integer when creating a list element from a numerical value.');
					}

					let generatedListValue = null;
					if (this.listDefinitions === null) {
						return throwNullException('this.listDefinitions');
					}

					const foundListDef = this.listDefinitions.TryListGetDefinition(listNameVal.value, null);
					if (foundListDef.exists) {
						// Originally a primitive type, but here, can be null.
						// TODO: Replace by default value?
						if (intVal.value === null) {
							return throwNullException('minInt.value');
						}

						const foundItem = foundListDef.result!.TryGetItemWithValue(intVal.value, InkListItem.Null);
						if (foundItem.exists) {
							generatedListValue = new ListValue(foundItem.result!, intVal.value);
						}
					} else {
						throw new StoryException('Failed to find LIST called ' + listNameVal.value);
					}

					if (generatedListValue == null)
						generatedListValue = new ListValue();

					this.state.PushEvaluationStack(generatedListValue);
					break;

				case ControlCommand.CommandType.ListRange:
					const max = asOrNull(this.state.PopEvaluationStack(), Value);
					const min = asOrNull(this.state.PopEvaluationStack(), Value);

					// var targetList = state.PopEvaluationStack () as ListValue;
					const targetList = asOrNull(this.state.PopEvaluationStack(), ListValue);

					if (!targetList || !min || !max) {
						throw new StoryException('Expected list, minimum and maximum for LIST_RANGE');
					} else if (!targetList.value) {
						return throwNullException('targetList.value');
					}

					const result = targetList.value.ListWithSubRange(
						min.valueObject,
						max.valueObject,
					);

					this.state.PushEvaluationStack (new ListValue(result));

					break;

				case ControlCommand.CommandType.ListRandom: {
					const listVal = this.state.PopEvaluationStack() as ListValue;
					if (!listVal) {
						throw new StoryException('Expected list for LIST_RANDOM');
					}

					const list = listVal.value;

					let newList: InkList | null = null;
					if (!list) {
						throw throwNullException('list');
					} else if (!list.Count) {
						newList = new InkList();
					} else {
						// Generate a random index for the element to take
						const resultSeed = this.state.storySeed +
							this.state.previousRandom;

						const random = new PRNG(resultSeed);
						const nextRandom = random.next();
						const listItemIndex = nextRandom % list.Count;

						// This bit is a little different from the original
						// C# code, since iterators do not work in the same way.
						// First, we iterate listItemIndex - 1 times, calling next().
						// The listItemIndex-th time is made outside of the loop,
						// in order to retrieve the value.
						let listEnumerator = list.entries();
						for (let ii = 0; ii <= listItemIndex - 1; ii += 1) {
							listEnumerator.next();
						}

						let value = listEnumerator.next().value;
						let randomItem: KeyValuePair<InkListItem, number> = {
							Key: InkListItem.fromSerializedKey(value[0]),
							Value: value[1],
						};

						// Origin list is simply the origin of the one element
						if (!randomItem.Key.originName) {
							return throwNullException('randomItem.Key.originName');
						}

						newList = new InkList(randomItem.Key.originName, this);
						newList.Add(randomItem.Key, randomItem.Value);
						this.state.previousRandom = nextRandom;
					}

					this.state.PushEvaluationStack(new ListValue(newList));

					break;
				}

				default:
					this.Error('unhandled ControlCommand: ' + evalCommand);
					break;
			}

			return true;
		} else if (contentObj instanceof VariableAssignment) {
			// Variable assignment
			const varAss = contentObj;
			const assignedVal = this.state.PopEvaluationStack();
			this.state.variablesState.Assign(varAss, assignedVal);

			return true;
		} else if (contentObj instanceof VariableReference) {
			// Variable reference
			const varRef = contentObj;
			let foundValue = null;

			// Explicit read count value
			if (!varRef.pathForCount) {
				const container = varRef.containerForCount;
				const count = this.VisitCountForContainer(container);
				foundValue = new IntValue(count);
			} else {
				// Normal variable reference
				foundValue = this.state.variablesState.GetVariableWithName(
					varRef.name,
				);

				if (!foundValue) {
					const defaultVal = this.state.variablesState.TryGetDefaultVariableValue (varRef.name);
					if (defaultVal) {
						this.Warning("Variable not found in save state: '" + varRef.name + "', but seems to have been newly created. Assigning value from latest ink's declaration: " + defaultVal);
						foundValue = defaultVal;

						// Save for future usage, preventing future errors
						// Only do this for variables that are known to be globals, not those that may be missing temps.
						this.state.variablesState.SetGlobal(varRef.name, foundValue);
					} else {
						this.Warning ("Variable not found: '" + varRef.name + "'. Using default value of 0 (false). This can happen with temporary variables if the declaration hasn't yet been hit.");
						foundValue = new IntValue(0);
					}
				}
			}

			this.state.PushEvaluationStack(foundValue);

			return true;
		} else if (contentObj instanceof NativeFunctionCall) {
			// Native function call
			let func = contentObj;
			let funcParams = this.state.PopEvaluationStack(func.numberOfParameters);
			let result = func.Call(funcParams);
			this.state.PushEvaluationStack(result);
			return true;
		}

		// No control content, must be ordinary content
		return false;
	}

	public ChoosePathString = (
		path: string,
		resetCallstack = true,
		args: any[] = [],
	) => {
		this.IfAsyncWeCant('call ChoosePathString right now');

		if (resetCallstack) {
			this.ResetCallstack();
		} else {
			if (this.state.callStack.currentElement.type == PushPopType.Function) {
				let funcDetail = '';
				const container = this.state
					.callStack
					.currentElement
					.currentPointer
					.container;

				if (container) {
					funcDetail = '(' + container.path.toString() + ') ';
				}

				throw new Error('Story was running a function ' + funcDetail + 'when you called ChoosePathString(' + path + ') - this is almost certainly not not what you want! Full stack trace: \n'+this.state.callStack.callStackTrace);
			}
		}

		this.state.PassArgumentsToEvaluationStack(args);
		this.ChoosePath(new Path(path));
	};

	public IfAsyncWeCant = (activityStr: string) => {
		if (this._asyncContinueActive) {
			throw new Error(
				"Can't " + activityStr + '. Story is in the middle of a ContinueAsync(). Make more ContinueAsync() calls or a single Continue() call beforehand.'
			);
		}
	};

	public ChoosePath = (p: Path, incrementingTurnIndex: boolean = true) => {
		this.state.SetChosenPath(p, incrementingTurnIndex);

		// Take a note of newly visited containers for read counts etc
		this.VisitChangedContainersDueToDivert();
	};

	// @ts-ignore
	public ChooseChoiceIndex = (choiceIdx: number) => {
		choiceIdx = choiceIdx;
		let choices = this.currentChoices;
		this.Assert(choiceIdx >= 0 && choiceIdx < choices.length, 'choice out of range');

		let choiceToChoose = choices[choiceIdx];
		if (choiceToChoose.threadAtGeneration === null) { return throwNullException('choiceToChoose.threadAtGeneration'); }
		if (choiceToChoose.targetPath === null) { return throwNullException('choiceToChoose.targetPath'); }

		this.state.callStack.currentThread = choiceToChoose.threadAtGeneration;

		this.ChoosePath(choiceToChoose.targetPath);
	};

	public HasFunction = (functionName: string) => {
		try {
			return this.KnotContainerWithName(functionName) != null;
		} catch (e) {
			return false;
		}
	};

	public EvaluateFunction = (
		functionName: string,
		args: any[] = [],
		returnTextOutput: boolean = false,
	): Story.EvaluateFunctionTextOutput | any => {
		// EvaluateFunction behaves slightly differently than the C# version.
		// In C#, you can pass a (second) parameter `out textOutput` to get the
		// text outputted by the function. This is not possible in js. Instead,
		// we maintain the regular signature (functionName, args), plus an
		// optional third parameter returnTextOutput. If set to true, we will
		// return both the textOutput and the returned value, as an object.

		this.IfAsyncWeCant('evaluate a function');

		if (!functionName || !functionName.trim()) {
			throw new Error('Function is null, empty, or white space.');
		}

		const funcContainer = this.KnotContainerWithName(functionName);
		if (!funcContainer) {
			throw new Error("Function doesn't exist: '" + functionName + "'");
		}

		const outputStreamBefore: InkObject[] = [];
		outputStreamBefore.push.apply(outputStreamBefore, this.state.outputStream);
		this.state.ResetOutput();
		this.state.StartFunctionEvaluationFromGame(funcContainer, args);

		// Evaluate the function, and collect the string output
		let stringOutput = new StringBuilder();
		while (this.canContinue) {
			stringOutput.Append(this.Continue());
		}

		const textOutput = stringOutput.toString();
		this._state.ResetOutput(outputStreamBefore);
		const result = this.state.CompleteFunctionEvaluationFromGame();

		return returnTextOutput ?
			{
				returned: result,
				output: textOutput,
			} :
			result;
	};

	public EvaluateExpression = (exprContainer: Container) => {
		const startCallStackHeight = this.state.callStack.elements.length;
		this.state.callStack.Push(PushPopType.Tunnel);
		this._temporaryEvaluationContainer = exprContainer;
		this.state.GoToStart();
		const evalStackHeight = this.state.evaluationStack.length;
		this.Continue();
		this._temporaryEvaluationContainer = null;

		// Should have fallen off the end of the Container, which should
		// have auto-popped, but just in case we didn't for some reason,
		// manually pop to restore the state (including currentPath).
		if (this.state.callStack.elements.length > startCallStackHeight) {
			this.state.PopCallStack();
		}

		let endStackHeight = this.state.evaluationStack.length;
		if (endStackHeight > evalStackHeight) {
			return this.state.PopEvaluationStack();
		} else {
			return null;
		}
	};

	public readonly allowExternalFunctionFallbacks: boolean = false;

	// @ts-ignore
	public CallExternalFunction = (
		funcName: string | null,
		numberOfArguments: number,
	) => {
		if (!funcName) {
			return throwNullException('funcName');
		}

		const func = this._externals.get(funcName);
		let fallbackFunctionContainer = null;
		let foundExternal = typeof func !== 'undefined';

		// Try to use fallback function?
		if (!foundExternal) {
			if (this.allowExternalFunctionFallbacks) {
				fallbackFunctionContainer = this.KnotContainerWithName(funcName);
				this.Assert(fallbackFunctionContainer !== null, "Trying to call EXTERNAL function '" + funcName + "' which has not been bound, and fallback ink function could not be found.");

				// Divert direct into fallback function and we're done
				this.state.callStack.Push(
					PushPopType.Function,
					undefined,
					this.state.outputStream.length,
				);

				this.state.divertedPointer = Pointer.StartOf(
					fallbackFunctionContainer,
				);

				return;
			} else {
				this.Assert(false, "Trying to call EXTERNAL function '" + funcName + "' which has not been bound (and ink fallbacks disabled).");
			}
		};

		// Pop arguments
		const args: any[] = [];
		for (let ii = 0; ii < numberOfArguments; ++ii) {
			// var poppedObj = state.PopEvaluationStack () as Value;
			const poppedObj = asOrThrows(this.state.PopEvaluationStack(), Value);
			const valueObj = poppedObj.valueObject;
			args.push(valueObj);
		}

		// Reverse arguments from the order they were popped,
		// so they're the right way round again.
		args.reverse();

		// Run the function!
		const funcResult = func!(args);

		// Convert return value (if any) to the a type that the ink engine can use
		let returnObj = null;
		if (funcResult != null) {
			returnObj = Value.Create(funcResult);
			this.Assert(returnObj !== null, 'Could not create ink value from returned object of type ' + (typeof funcResult));
		} else {
			returnObj = new Void();
		}

		this.state.PushEvaluationStack(returnObj);
	};

	public BindExternalFunctionGeneral = (
		funcName: string,
		func: Story.ExternalFunction,
	) => {
		this.IfAsyncWeCant('bind an external function');
		this.Assert(!this._externals.has(funcName), "Function '" + funcName + "' has already been bound.");
		this._externals.set(funcName, func);
	};

	// We're skipping type coercion in this implementation. First of, js
	// is loosely typed, so it's not that important. Secondly, there is no
	// clean way (AFAIK) for the user to describe what type of parameters
	// they expect.
	public TryCoerce = (value: any) => value;

	public BindExternalFunction = (
		funcName: string,
		func: Story.ExternalFunction,
	) => {
		this.Assert(func != null, "Can't bind a null function");
		this.BindExternalFunctionGeneral(funcName, (args: any) => {
			this.Assert(args.length >= func.length, 'External function expected ' + func.length + ' arguments');
			const coercedArgs = [];
			for (let ii = 0, len = args.length; ii < len; ii += 1){
				coercedArgs[ii] = this.TryCoerce(args[ii]);
			}

			return func.apply(null, coercedArgs);
		});
	}

	public UnbindExternalFunction = (funcName: string) => {
		this.IfAsyncWeCant('unbind an external a function');
		this.Assert(
			this._externals.has(funcName),
			"Function '" + funcName + "' has not been bound.",
		);

		this._externals.delete(funcName);
	}

	public ValidateExternalBindings(): void;
	public ValidateExternalBindings(c: Container | null, missingExternals: Set<string>): void;
	public ValidateExternalBindings(o: InkObject | null, missingExternals: Set<string>): void;
	// @ts-ignore
	public ValidateExternalBindings() {
		let container: Container | null = null;
		let obj: InkObject | null = null;
		let missingExternals: Set<string> = arguments[1] || new Set();

		if (arguments[0] instanceof Container) {
			container = arguments[0];
		}

		if (arguments[0] instanceof InkObject) {
			obj = arguments[0];
		}

		if (container === null && obj === null) {
			this.ValidateExternalBindings(this._mainContentContainer, missingExternals);
			this._hasValidatedExternals = true;

			// No problem! Validation complete
			if( missingExternals.size == 0 ) {
				this._hasValidatedExternals = true;
			} else {
				let message = 'Error: Missing function binding for external';
				message += (missingExternals.size > 1) ? 's' : '';
				message += ": '";
				message += Array.from(missingExternals).join("', '");
				message += "' ";
				message += (this.allowExternalFunctionFallbacks) ? ', and no fallback ink function found.' : ' (ink fallbacks disabled)';

				this.Error(message);
			}
		} else if (container != null) {
			for (let innerContent of container.content) {
				let container = innerContent as Container;
				if (container == null || !container.hasValidName)
					this.ValidateExternalBindings (innerContent, missingExternals);
			}
			for (let [, value] of container.namedContent) {
				this.ValidateExternalBindings (asOrNull(value, InkObject), missingExternals);
			}
		} else if (obj != null) {
			let divert = asOrNull(obj, Divert);
			if (divert && divert.isExternal) {
				let name = divert.targetPathString;
				if (name === null) { return throwNullException('name'); }
				if (!this._externals.has(name)) {
					if (this.allowExternalFunctionFallbacks) {
						let fallbackFound = this.mainContentContainer.namedContent.has(name);
						if (!fallbackFound) {
							missingExternals.add(name);
						}
					} else {
						missingExternals.add(name);
					}
				}
			}
		}
	};

	public ObserveVariable = (
		variableName: string,
		observer: Story.VariableObserver,
	) => {
		this.IfAsyncWeCant('observe a new variable');
		if (this._variableObservers === null) {
			this._variableObservers = new Map();
		}

		if (!this.state.variablesState.GlobalVariableExistsWithName(variableName)) {
			throw new StoryException("Cannot observe variable '"+variableName+"' because it wasn't declared in the ink story.");
		}

		if (this._variableObservers.has(variableName)) {
			this._variableObservers.get(variableName)!.push(observer);
		} else {
			this._variableObservers.set(variableName, [observer]);
		}
	}

	public ObserveVariables = (
		variableNames: string[],
		observers: Story.VariableObserver[],
	) => {
		for (let ii = 0, len = variableNames.length; ii < len; ii += 1){
			this.ObserveVariable(variableNames[ii], observers[ii]);
		}
	};

	public RemoveVariableObserver = (
		observer: Story.VariableObserver,
		specificVariableName: string,
	) => {
		this.IfAsyncWeCant('remove a variable observer');
		if (!this._variableObservers) {
			return;
		}

		if (typeof specificVariableName !== 'undefined') {
			if (this._variableObservers.has(specificVariableName)) {
				let observers = this._variableObservers.get(specificVariableName)!;
				observers.splice(observers.indexOf(observer), 1);
			}
		} else {
			let keys = this._variableObservers.keys();

			for (let varName of keys){
				let observers = this._variableObservers.get(varName)!;
				observers.splice(observers.indexOf(observer), 1);
			}
		}
	}

	public VariableStateDidChangeEvent = (
		variableName: string,
		newValueObj: InkObject,
	) => {
		if (this._variableObservers === null)
			return;

		let observers = this._variableObservers.get(variableName);
		if (typeof observers !== 'undefined') {
			if (!(newValueObj instanceof Value)) {
				throw new Error("Tried to get the value of a variable that isn't a standard type");
			}
			// var val = newValueObj as Value;
			let val = asOrThrows(newValueObj, Value);

			for (let observer of observers) {
				observer(variableName, val.valueObject);
			}
		}
	};

	get globalTags() {
		return this.TagsAtStartOfFlowContainerWithPathString('');
	}

	public TagsForContentAtPath(path: string) {
		return this.TagsAtStartOfFlowContainerWithPathString(path);
	}

	public TagsAtStartOfFlowContainerWithPathString(pathString: string) {
		let path = new Path(pathString);
		let flowContainer = this.ContentAtPath(path).container;
		if (!flowContainer) {
			return throwNullException('flowContainer');
		}

		while (true) {
			const firstContent: InkObject = flowContainer.content[0];
			if (firstContent instanceof Container) {
				flowContainer = firstContent;
			} else {
				break;
			}
		}

		let tags: string[] | null = null;

		for (const item of flowContainer.content) {
			// var tag = c as Runtime.Tag;
			const tag = asOrNull(item, Tag);
			if (tag) {
				if (!tags) {
					tags = [];
				}

				tags.push(tag.text);
			} else {
				break;
			}
		}

		return tags;
	};

	public BuildStringOfHierarchy = () => {
		const sb = new StringBuilder();
		this.mainContentContainer.BuildStringOfHierarchy(
			sb,
			0,
			this.state.currentPointer.Resolve(),
		);

		return sb.toString();
	};

	public BuildStringOfContainer = (container: Container) => {
		const sb = new StringBuilder();
		container.BuildStringOfHierarchy(
			sb,
			0,
			this.state.currentPointer.Resolve(),
		);

		return sb.toString();
	};

	public NextContent = () => {
		this.state.previousPointer = this.state.currentPointer.copy();
		if (!this.state.divertedPointer.isNull) {
			this.state.currentPointer = this.state.divertedPointer.copy();
			this.state.divertedPointer = Pointer.Null;
			this.VisitChangedContainersDueToDivert();
			if (!this.state.currentPointer.isNull) {
				return;
			}
		}

		const successfulPointerIncrement = this.IncrementContentPointer();
		if (!successfulPointerIncrement) {
			let didPop = false;
			if (this.state.callStack.CanPop(PushPopType.Function)) {
				this.state.PopCallStack(PushPopType.Function);
				if (this.state.inExpressionEvaluation) {
					this.state.PushEvaluationStack(new Void());
				}

				didPop = true;
			} else if (this.state.callStack.canPopThread) {
				this.state.callStack.PopThread();
				didPop = true;
			} else {
				this.state.TryExitFunctionEvaluationFromGame();
			}

			if (didPop && !this.state.currentPointer.isNull) {
				this.NextContent();
			}
		}
	}

	public readonly IncrementContentPointer = () => {
		let successfulIncrement = true;
		let pointer = this.state.callStack.currentElement.currentPointer.copy();
		pointer.index += 1;
		if (pointer.container === null) {
			return throwNullException('pointer.container');
		}

		while (pointer.index >= pointer.container.content.length) {
			successfulIncrement = false;

			// Container nextAncestor = pointer.container.parent as Container;
			let nextAncestor = asOrNull(pointer.container.parent, Container);
			if (nextAncestor instanceof Container === false) {
				break;
			}

			let indexInAncestor = nextAncestor!.content.indexOf(pointer.container);
			if (indexInAncestor == -1) {
				break;
			}

			pointer = new Pointer(nextAncestor, indexInAncestor);
			pointer.index += 1;
			successfulIncrement = true;
			if (pointer.container === null) {
				return throwNullException('pointer.container');
			}
		}

		if (!successfulIncrement) {
			pointer = Pointer.Null;
		}

		this.state.callStack.currentElement.currentPointer = pointer.copy();

		return successfulIncrement;
	};

	public TryFollowDefaultInvisibleChoice = () => {
		const allChoices = this.state.currentChoices;

		const invisibleChoices = allChoices.filter((char) => (
			char.isInvisibleDefault
		));

		if (!invisibleChoices.length ||
			allChoices.length > invisibleChoices.length)
		{
			return false;
		}

		const choice = invisibleChoices[0];
		if (!choice.targetPath) {
			return throwNullException('choice.targetPath');
		} else if (!choice.threadAtGeneration) {
			return throwNullException('choice.threadAtGeneration');
		}

		this.state.callStack.currentThread = choice.threadAtGeneration;
		this.ChoosePath(choice.targetPath, false);

		return true;
	};

	public VisitCountForContainer= (container: Container | null) => {
		if (container === null) {
			return throwNullException('container');
		} else if (!container.visitsShouldBeCounted ) {
			console.warn(`Read count for target (${container.name} - on ${container.debugMetadata}) unknown. The story may need to be compiled with countAllVisits flag (-c).`);
			return 0;
		}

		let count = 0;
		const containerPathStr = container.path.toString();
		count = this.state.visitCounts.get(containerPathStr) || count;

		return count;
	};

	public IncrementVisitCountForContainer = (container: Container) => {
		let count = 0;
		let containerPathStr = container.path.toString();
		if (this.state.visitCounts.has(containerPathStr)) {
			count = this.state.visitCounts.get(containerPathStr)!;
		}

		count += 1;
		this.state.visitCounts.set(containerPathStr, count);
	};

	public RecordTurnIndexVisitToContainer= (container: Container) => {
		const containerPathStr = container.path.toString();
		this.state.turnIndices.set(containerPathStr, this.state.currentTurnIndex);
	};

	public TurnsSinceForContainer = (container: Container) => {
		if (!container.turnIndexShouldBeCounted) {
			this.Error('TURNS_SINCE() for target ('+container.name+' - on '+container.debugMetadata+') unknown. The story may need to be compiled with countAllVisits flag (-c).');
		}

		let containerPathStr = container.path.toString();
		let index = this.state.turnIndices.get(containerPathStr);
		if (index !== undefined) {
			return this.state.currentTurnIndex - index;
		} else {
			return -1;
		}
	};

	public NextSequenceShuffleIndex = () => {
		// var numElementsIntVal = state.PopEvaluationStack () as IntValue;
		let numElementsIntVal = asOrNull(this.state.PopEvaluationStack(), IntValue);
		if (!(numElementsIntVal instanceof IntValue)) {
			this.Error('expected number of elements in sequence for shuffle index');
			return 0;
		}

		let seqContainer = this.state.currentPointer.container;
		if (seqContainer === null) { return throwNullException('seqContainer'); }

		// Originally a primitive type, but here, can be null.
		// TODO: Replace by default value?
		if (numElementsIntVal.value === null) {
			return throwNullException('numElementsIntVal.value');
		}

		const numElements = numElementsIntVal.value;

		// var seqCountVal = state.PopEvaluationStack () as IntValue;
		const seqCountVal = asOrThrows(this.state.PopEvaluationStack(), IntValue);
		const seqCount = seqCountVal.value;

		// Originally a primitive type, but here, can be null.
		// TODO: Replace by default value?
		if (seqCount === null) {
			return throwNullException('seqCount');
		}

		const loopIndex = seqCount / numElements;
		const iterationIndex = seqCount % numElements;
		const seqPathStr = seqContainer.path.toString();
		let sequenceHash = 0;
		for (let ii = 0, len = seqPathStr.length; ii < len; ii++){
			sequenceHash += seqPathStr.charCodeAt(ii) || 0;
		}

		const randomSeed = sequenceHash + loopIndex + this.state.storySeed;
		const random = new PRNG(Math.floor(randomSeed));

		const unpickedIndices = [];
		for (let ii = 0; ii < numElements; ++ii) {
			unpickedIndices.push(ii);
		}

		for (let ii = 0; ii <= iterationIndex; ++ii) {
			let chosen = random.next() % unpickedIndices.length;
			let chosenIndex = unpickedIndices[chosen];
			unpickedIndices.splice(chosen, 1);

			if (ii === iterationIndex) {
				return chosenIndex;
			}
		}

		throw new Error('Should never reach here');
	};

	public Error = (message: string, useEndLineNumber = false): never => {
		let e = new StoryException(message);
		e.useEndLineNumber = useEndLineNumber;
		throw e;
	};

	public Warning = (message: string) => this.AddError(message, true);

	public AddError = (message: string, isWarning = false, useEndLineNumber = false) => {
		const dm = this.currentDebugMetadata;
		const errorTypeStr = isWarning ? 'WARNING' : 'ERROR';

		if (dm) {
			let lineNum = useEndLineNumber ? dm.endLineNumber : dm.startLineNumber;
			message = 'RUNTIME ' + errorTypeStr + ": '" + dm.fileName + "' line " + lineNum + ': ' + message;
		} else if(!this.state.currentPointer.isNull) {
			message = 'RUNTIME ' + errorTypeStr + ': (' + this.state.currentPointer + '): ' + message;
		} else {
			message = 'RUNTIME ' + errorTypeStr + ': ' + message;
		}

		this.state.AddError(message, isWarning);

		// In a broken state, don't need to know about any other errors.
		if (!isWarning) {
			this.state.ForceEnd();
		}
	};

	public Assert = (condition: boolean, message: string | null = null) => {
		if (!condition) {
			if (!message) {
				message = 'Story assert';
			}

			throw new Error(message + ' ' + this.currentDebugMetadata);
		}
	};

	get currentDebugMetadata(): DebugMetadata | null {
		let dm: DebugMetadata | null;
		let pointer = this.state.currentPointer;
		if (!pointer.isNull && pointer.Resolve() !== null) {
			dm = pointer.Resolve()!.debugMetadata;
			if (dm) {
				return dm;
			}
		}

		for (let ii = this.state.callStack.elements.length - 1; ii >= 0; --ii) {
			pointer = this.state.callStack.elements [ii].currentPointer;
			if (!pointer.isNull && pointer.Resolve() !== null) {
				dm = pointer.Resolve()!.debugMetadata;
				if (dm) {
					return dm;
				}
			}
		}

		for (let ii = this.state.outputStream.length - 1; ii >= 0; --ii) {
			let outputObj = this.state.outputStream [ii];
			dm = outputObj.debugMetadata;
			if (dm) {
				return dm;
			}
		}

		return null;
	}

	get mainContentContainer() {
		if (this._temporaryEvaluationContainer) {
			return this._temporaryEvaluationContainer;
		} else {
			return this._mainContentContainer;
		}
	}

	/**
	 * `_mainContentContainer` is almost guaranteed to be set in the
	 * constructor, unless the json is malformed.
	 */
	private _mainContentContainer!: Container;
	private _listDefinitions: ListDefinitionsOrigin | null = null;

	private _externals: Map<string, Story.ExternalFunction>;
	private _variableObservers: Map<string, Story.VariableObserver[]> | null = null;
	private _hasValidatedExternals: boolean = false;

	private _temporaryEvaluationContainer: Container | null = null;

	/**
	 * `state` is almost guaranteed to be set in the constructor, unless
	 * using the compiler-specific constructor which will likely not be used in
	 * the real world.
	 */
	private _state!: StoryState;

	private _asyncContinueActive: boolean = false;
	private _stateAtLastNewline: StoryState | null = null;

	private _recursiveContinueCount: number = 0;

	private _profiler: any | null = null; // TODO: Profiler
}

export namespace Story {
	export enum OutputStateChange {
		NoChange = 0,
		ExtendedBeyondNewline = 1,
		NewlineRemoved = 2,
	}

	export interface EvaluateFunctionTextOutput {
		returned: any;
		output: string;
	}

	export type VariableObserver = (variableName: string, newValue: any) => void;
	export type ExternalFunction = (...args: any) => any;
}
