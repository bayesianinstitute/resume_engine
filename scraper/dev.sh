# Check if the conda environment is activated
# if [ "$CONDA_DEFAULT_ENV" != "jobspy" ]; then
#     echo "Activating conda environment: jobspy"
#     conda activate jobspy
# else
#     echo "Conda environment 'jobspy' is already activated."
# fi

uvicorn app.main:app --reload